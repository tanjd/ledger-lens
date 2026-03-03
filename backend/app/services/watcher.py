"""Watchdog file-system observer for the data/ directory.

Automatically ingests any new or modified *.csv file dropped into data/.
Started and stopped via the FastAPI lifespan context manager in main.py.

Debounce: rapid-fire events for the same file (e.g. on_created + on_modified)
are coalesced into a single ingest after a 1.5 s quiet window.
"""

from __future__ import annotations

import logging
import threading
from pathlib import Path

from watchdog.events import FileSystemEvent, FileSystemEventHandler
from watchdog.observers import Observer
from watchdog.observers.api import BaseObserver

from app.database import engine
from app.services.ingestor import ingest_file

logger = logging.getLogger(__name__)

_DEBOUNCE_SECONDS = 1.5


class _CsvHandler(FileSystemEventHandler):
    def __init__(self) -> None:
        super().__init__()
        self._timers: dict[str, threading.Timer] = {}
        self._lock = threading.Lock()

    def on_created(self, event: FileSystemEvent) -> None:
        if not event.is_directory and str(event.src_path).endswith(".csv"):
            self._schedule(str(event.src_path))

    def on_modified(self, event: FileSystemEvent) -> None:
        if not event.is_directory and str(event.src_path).endswith(".csv"):
            self._schedule(str(event.src_path))

    def _schedule(self, filepath: str) -> None:
        with self._lock:
            existing = self._timers.pop(filepath, None)
            if existing is not None:
                existing.cancel()
            timer = threading.Timer(_DEBOUNCE_SECONDS, self._try_ingest, args=[filepath])
            self._timers[filepath] = timer
            timer.start()

    def _try_ingest(self, filepath: str) -> None:
        from sqlmodel import Session

        with self._lock:
            self._timers.pop(filepath, None)

        logger.info("Watcher detected change: %s", filepath)
        try:
            with Session(engine) as session:
                ingest_file(filepath, session)
        except Exception:
            logger.exception("Watcher failed to ingest %s", filepath)


def start_watcher(data_dir: str) -> BaseObserver:
    observer: BaseObserver = Observer()
    observer.schedule(_CsvHandler(), data_dir, recursive=False)
    observer.start()
    logger.info("Watching %s for new CSV files", data_dir)
    return observer


def ingest_existing(data_dir: str) -> None:
    """Ingest all *.csv files already present in data_dir at startup."""
    from sqlmodel import Session

    for csv_file in Path(data_dir).glob("*.csv"):
        logger.info("Startup ingest: %s", csv_file)
        try:
            with Session(engine) as session:
                ingest_file(str(csv_file), session)
        except Exception:
            logger.exception("Startup ingest failed for %s", csv_file)
