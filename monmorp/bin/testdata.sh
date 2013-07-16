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

wget 'http://ja.wikipedia.org/wiki/%E7%B4%99'
wget 'http://ja.wikipedia.org/wiki/%E6%97%A5%E6%9C%AC%E3%81%AE%E4%BC%81%E6%A5%AD%E4%B8%80%E8%A6%A7_(%E3%83%91%E3%83%AB%E3%83%97%E3%83%BB%E7%B4%99)'
wget 'http://ja.wikipedia.org/wiki/%E6%9D%BF%E7%B4%99'
wget 'http://ja.wikipedia.org/wiki/%E6%8A%98%E3%82%8A%E7%B4%99'
wget 'http://ja.wikipedia.org/wiki/%E9%9B%BB%E5%AD%90%E3%83%9A%E3%83%BC%E3%83%91%E3%83%BC'
wget 'http://ja.wikipedia.org/wiki/%E3%83%9A%E3%83%BC%E3%83%91%E3%83%BC%E3%83%8A%E3%82%A4%E3%83%95'
wget 'http://ja.wikipedia.org/wiki/%E6%96%B0%E8%81%9E'
wget 'http://ja.wikipedia.org/wiki/%E5%B0%81%E7%AD%92'
wget 'http://ja.wikipedia.org/wiki/%E3%83%88%E3%82%A4%E3%83%AC%E3%83%83%E3%83%88%E3%83%9A%E3%83%BC%E3%83%91%E3%83%BC'
wget 'http://ja.wikipedia.org/wiki/%E6%AE%B5%E3%83%9C%E3%83%BC%E3%83%AB'
wget 'http://ja.wikipedia.org/wiki/%E5%8D%B0%E5%88%B7'
wget 'http://ja.wikipedia.org/wiki/%E7%B4%99%E3%81%AE%E5%8D%9A%E7%89%A9%E9%A4%A8'
wget 'http://ja.wikipedia.org/wiki/%E7%B4%99%E5%B8%83'
wget 'http://ja.wikipedia.org/wiki/%E3%83%9A%E3%83%BC%E3%83%91%E3%83%BC%E3%82%AF%E3%83%A9%E3%83%95%E3%83%88'
wget 'http://ja.wikipedia.org/wiki/%E3%82%8F%E3%82%89%E5%8D%8A%E7%B4%99'

wget 'http://ja.wikipedia.org/wiki/%E6%9C%88%E6%8E%A2%E6%9F%BB'
wget 'http://ja.wikipedia.org/wiki/%E6%9C%88%E9%9D%A2%E7%9D%80%E9%99%B8'
wget 'http://ja.wikipedia.org/wiki/%E5%AE%87%E5%AE%99%E9%96%8B%E7%99%BA'
wget 'http://ja.wikipedia.org/wiki/%E5%AE%87%E5%AE%99%E9%96%8B%E7%99%BA%E7%AB%B6%E4%BA%89'
wget 'http://ja.wikipedia.org/wiki/%E5%AE%87%E5%AE%99%E6%8E%A2%E6%9F%BB%E6%A9%9F'
wget 'http://ja.wikipedia.org/wiki/%E6%9C%88%E9%9D%A2%E8%BB%8A'
wget 'http://ja.wikipedia.org/wiki/%E3%82%A2%E3%83%9D%E3%83%AD%E8%A8%88%E7%94%BB'

wget 'http://ja.wikipedia.org/wiki/%E9%82%84%E5%85%83'
wget 'http://ja.wikipedia.org/wiki/%E3%83%92%E3%83%89%E3%83%AD%E3%82%AD%E3%82%B7%E5%8C%96%E5%90%88%E7%89%A9'
wget 'http://ja.wikipedia.org/wiki/%E6%A0%B9%E3%81%AE%E8%AA%AC'
wget 'http://ja.wikipedia.org/wiki/%E6%9C%89%E6%A9%9F%E5%8C%96%E5%AD%A6'
wget 'http://ja.wikipedia.org/wiki/%E6%B0%B4%E5%92%8C%E7%89%A9'
wget 'http://ja.wikipedia.org/wiki/%E8%8A%B3%E9%A6%99%E5%8C%96%E5%90%88%E7%89%A9'
wget 'http://ja.wikipedia.org/wiki/%E5%8D%8A%E5%90%88%E6%88%90'
wget 'http://ja.wikipedia.org/wiki/%E6%BA%B6%E5%AA%92'
popd

HTMLDATAJS="${CURDIR}/../data/htmldata.json"
TESTDATAJS="${CURDIR}/../data/testdata.json"
HTMLDIR="${CURDIR}/../html/testdata"
if [ "$1" != "" ]; then
		HTMLDIR="$1"
fi
for f in `find ${HTMLDIR} -type f | grep -v '.gitignore'`; do ((echo '{body:"'; cat $f  | sed -e 's/\\/\\\\/g' | sed -e 's/$/\\n/g' |sed -e 's/\r//g' | sed -e 's/\t/\\t/g' | sed -e 's/"/\\"/g' ; echo '"}') | tr  -d '\n' ) ;echo ; done > ${HTMLDATAJS}

echo '=== IMPORT HTML TESTDATA (files => test.testdoc.html ) ==='
PRIMARY=`${MONGO_SHELL} ${MONGO_NODE} --quiet ${CURDIR}/../../lib/utils.js ${CURDIR}/../../lib/getprimary.js | tail -n 1`
${MONGO_IMPORT} -h ${PRIMARY} --drop -d test -c testdoc.html --file ${HTMLDATAJS}

echo '=== COMVERT FROM HTML TO TEXT (test.testdoc.html => test.testdoc ) ==='
${MONGO_EXPORT} -h ${PRIMARY} -d test -c testdoc.html -f _id,body | ${CURDIR}/../html/parsehtml.js -m > ${TESTDATAJS}

${MONGO_IMPORT} -h ${PRIMARY} --drop -d test -c testdoc --file ${TESTDATAJS}
