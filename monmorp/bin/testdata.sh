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
popd

HTMLDATAJS="${CURDIR}/../data/htmldata.json"
TESTDATAJS="${CURDIR}/../data/testdata.json"
HTMLDIR="${CURDIR}/../html/testdata"
if [ "$1" != "" ]; then
		HTMLDIR="$1"
fi
for f in `find ${HTMLDIR} -type f | grep -v '.gitignore'`; do ((echo '{body:"'; cat $f  | sed -e 's/\\/\\\\/g' | sed -e 's/$/\\n/g' | sed -e 's/\t/\\t/g' | sed -e 's/"/\\"/g' ; echo '"}') | tr  -d '\n' ) ;echo ; done > ${HTMLDATAJS}

echo '=== IMPORT HTML TESTDATA (files => test.testdoc.html ) ==='
${MONGO_IMPORT} --drop -d test -c testdoc.html --file ${HTMLDATAJS}

echo '=== COMVERT FROM HTML TO TEXT (test.testdoc.html => test.testdoc ) ==='
${MONGO_SHELL} --quiet --eval "var _COL='test.testdoc.html';var _BODY='body';" ${CURDIR}/../lib/utils.js ${CURDIR}/../lib/exportdocs.js | grep -v '^loading file:' | while read line; do
		echo $line | ${CURDIR}/../html/parsehtml.js
done > ${TESTDATAJS}

${MONGO_IMPORT} --drop -d test -c testdoc --file ${TESTDATAJS}
