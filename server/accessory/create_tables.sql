CREATE TABLE parameters(session varchar(64), name varchar(64), value varchar(256), UNIQUE(session, name));
CREATE TABLE sessions(session varchar(64) primary key, expires int);