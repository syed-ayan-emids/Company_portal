from contextlib import contextmanager

import pymysql

from . import config


def get_connection():
    kwargs = dict(
        host=config.DB_HOST,
        port=config.DB_PORT,
        user=config.DB_USER,
        password=config.DB_PASSWORD,
        database=config.DB_NAME,
        charset="utf8mb4",
        autocommit=True,
        cursorclass=pymysql.cursors.DictCursor,
    )
    if getattr(config, "DB_SSL_CA", None):
        import ssl

        kwargs["ssl"] = ssl.create_default_context(ca=config.DB_SSL_CA)
    return pymysql.connect(**kwargs)


@contextmanager
def db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()


def query(sql, params=()):
    with db() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            return list(cur.fetchall())


def one(sql, params=()):
    with db() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            return cur.fetchone()


def execute(sql, params=()):
    with db() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            conn.commit()
            return cur.rowcount
