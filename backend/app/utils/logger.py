import structlog
import logging

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.stdlib.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.dev.ConsoleRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.DEBUG),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
)


def get_logger(name: str):
    return structlog.get_logger(name)
