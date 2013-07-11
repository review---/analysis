#!/usr/bin/env bash
CURDIR=`dirname $0`
source $CURDIR/../../mongo.env

pushd $CURDIR/../html/testdata
rm *
wget 'http://ja.wikipedia.org/wiki/NoSQL'
wget 'http://ja.wikipedia.org/wiki/Hibari_(dbms)'
wget 'http://ja.wikipedia.org/wiki/Apache_CouchDB'
wget 'http://ja.wikipedia.org/wiki/Hypertable'
wget 'http://ja.wikipedia.org/wiki/BigTable'
wget 'http://ja.wikipedia.org/wiki/HBase'
wget 'http://ja.wikipedia.org/wiki/Apache_Cassandra'
wget 'http://ja.wikipedia.org/wiki/Riak'
wget 'http://ja.wikipedia.org/wiki/MongoDB'
wget 'http://ja.wikipedia.org/wiki/PostgreSQL'
wget 'http://ja.wikipedia.org/wiki/MySQL'
wget 'http://ja.wikipedia.org/wiki/Firebird'
wget 'http://ja.wikipedia.org/wiki/Apache_Tomcat'
wget 'http://ja.wikipedia.org/wiki/Apache_ZooKeeper'
wget 'http://ja.wikipedia.org/wiki/Hadoop'
wget 'http://ja.wikipedia.org/wiki/Apache_HTTP_Server'
wget 'http://ja.wikipedia.org/wiki/Apache_Ant'
wget 'http://ja.wikipedia.org/wiki/Apache_Axis2'
wget 'http://ja.wikipedia.org/wiki/Apache_Maven'
wget 'http://ja.wikipedia.org/wiki/Log4j'
wget 'http://ja.wikipedia.org/wiki/Perl6'
wget 'http://ja.wikipedia.org/wiki/Rust_(%E3%83%97%E3%83%AD%E3%82%B0%E3%83%A9%E3%83%9F%E3%83%B3%E3%82%B0%E8%A8%80%E8%AA%9E)'
wget 'http://ja.wikipedia.org/wiki/Erlang'
wget 'http://ja.wikipedia.org/wiki/Python'
wget 'http://ja.wikipedia.org/wiki/Ruby'
wget 'http://ja.wikipedia.org/wiki/R%E8%A8%80%E8%AA%9E'
popd

HTMLDATAJS="${CURDIR}/../data/htmldata.json"
TESTDATAJS="${CURDIR}/../data/testdata.json"
HTMLDIR="${CURDIR}/../html/testdata"
if [ "$1" != "" ]; then
		HTMLDIR="$1"
fi
for f in `find ${HTMLDIR} -type f | grep -v '.gitignore'`; do ((echo '{body:"'; cat $f  | sed -e 's/\\/\\\\/g' | sed -e 's/$/\\n/g' | sed -e 's/\t/\\t/g' | sed -e 's/"/\\"/g' ; echo '"}') | tr  -d '\n' ) ;echo ; done > ${HTMLDATAJS}

echo '=== IMPORT HTML TESTDATA (files => test.testdoc.html ) ==='
PRIMARY=`${MONGO_SHELL} ${MONGO_NODE} --quiet ${CURDIR}/../../lib/utils.js ${CURDIR}/../../lib/getprimary.js | tail -n 1`
${MONGO_IMPORT} -h ${PRIMARY} --drop -d test -c testdoc.html --file ${HTMLDATAJS}

echo '=== COMVERT FROM HTML TO TEXT (test.testdoc.html => test.testdoc ) ==='
${MONGO_EXPORT} -h ${PRIMARY} -d test -c testdoc.html -f _id,body | ${CURDIR}/../html/parsehtml.js -m > ${TESTDATAJS}

${MONGO_IMPORT} -h ${PRIMARY} --drop -d test -c testdoc --file ${TESTDATAJS}
