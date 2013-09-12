#!/usr/bin/env bash
CURDIR=`dirname $0`

function fetch_samples {
		$CURDIR/htmlmon/htmlmon.js -B -N samplehtml -j 4 -A \
		-u  'http://ja.wikipedia.org/wiki/NoSQL' \
		-u  'http://ja.wikipedia.org/wiki/Hibari_(dbms)' \
		-u  'http://ja.wikipedia.org/wiki/Apache_CouchDB' \
		-u  'http://ja.wikipedia.org/wiki/Hypertable' \
		-u  'http://ja.wikipedia.org/wiki/BigTable' \
		-u  'http://ja.wikipedia.org/wiki/HBase' \
		-u  'http://ja.wikipedia.org/wiki/Apache_Cassandra' \
		-u  'http://ja.wikipedia.org/wiki/Riak' \
		-u  'http://ja.wikipedia.org/wiki/MongoDB' \
		-u  'http://ja.wikipedia.org/wiki/PostgreSQL' \
		-u  'http://ja.wikipedia.org/wiki/MySQL' \
		-u  'http://ja.wikipedia.org/wiki/Firebird' \
		-u  'http://ja.wikipedia.org/wiki/Apache_Tomcat' \
		-u  'http://ja.wikipedia.org/wiki/Apache_ZooKeeper' \
		-u  'http://ja.wikipedia.org/wiki/Hadoop' \
		-u  'http://ja.wikipedia.org/wiki/Apache_HTTP_Server' \
		-u  'http://ja.wikipedia.org/wiki/Apache_Ant' \
		-u  'http://ja.wikipedia.org/wiki/Apache_Axis2' \
		-u  'http://ja.wikipedia.org/wiki/Apache_Maven' \
		-u  'http://ja.wikipedia.org/wiki/Log4j' \
		-u  'http://ja.wikipedia.org/wiki/Perl6' \
		-u  'http://ja.wikipedia.org/wiki/Rust_(%E3%83%97%E3%83%AD%E3%82%B0%E3%83%A9%E3%83%9F%E3%83%B3%E3%82%B0%E8%A8%80%E8%AA%9E)' \
		-u  'http://ja.wikipedia.org/wiki/Erlang' \
		-u  'http://ja.wikipedia.org/wiki/Python' \
		-u  'http://ja.wikipedia.org/wiki/Ruby' \
		-u  'http://ja.wikipedia.org/wiki/R%E8%A8%80%E8%AA%9E' \
		 \
		-u  'http://ja.wikipedia.org/wiki/%E7%B4%99' \
		-u  'http://ja.wikipedia.org/wiki/%E6%97%A5%E6%9C%AC%E3%81%AE%E4%BC%81%E6%A5%AD%E4%B8%80%E8%A6%A7_(%E3%83%91%E3%83%AB%E3%83%97%E3%83%BB%E7%B4%99)' \
		-u  'http://ja.wikipedia.org/wiki/%E6%9D%BF%E7%B4%99' \
		-u  'http://ja.wikipedia.org/wiki/%E6%8A%98%E3%82%8A%E7%B4%99' \
		-u  'http://ja.wikipedia.org/wiki/%E9%9B%BB%E5%AD%90%E3%83%9A%E3%83%BC%E3%83%91%E3%83%BC' \
		-u  'http://ja.wikipedia.org/wiki/%E3%83%9A%E3%83%BC%E3%83%91%E3%83%BC%E3%83%8A%E3%82%A4%E3%83%95' \
		-u  'http://ja.wikipedia.org/wiki/%E6%96%B0%E8%81%9E' \
		-u  'http://ja.wikipedia.org/wiki/%E5%B0%81%E7%AD%92' \
		-u  'http://ja.wikipedia.org/wiki/%E3%83%88%E3%82%A4%E3%83%AC%E3%83%83%E3%83%88%E3%83%9A%E3%83%BC%E3%83%91%E3%83%BC' \
		-u  'http://ja.wikipedia.org/wiki/%E6%AE%B5%E3%83%9C%E3%83%BC%E3%83%AB' \
		-u  'http://ja.wikipedia.org/wiki/%E5%8D%B0%E5%88%B7' \
		-u  'http://ja.wikipedia.org/wiki/%E7%B4%99%E3%81%AE%E5%8D%9A%E7%89%A9%E9%A4%A8' \
		-u  'http://ja.wikipedia.org/wiki/%E7%B4%99%E5%B8%83' \
		-u  'http://ja.wikipedia.org/wiki/%E3%83%9A%E3%83%BC%E3%83%91%E3%83%BC%E3%82%AF%E3%83%A9%E3%83%95%E3%83%88' \
		-u  'http://ja.wikipedia.org/wiki/%E3%82%8F%E3%82%89%E5%8D%8A%E7%B4%99' \
		 \
		-u  'http://ja.wikipedia.org/wiki/%E6%9C%88%E6%8E%A2%E6%9F%BB' \
		-u  'http://ja.wikipedia.org/wiki/%E6%9C%88%E9%9D%A2%E7%9D%80%E9%99%B8' \
		-u  'http://ja.wikipedia.org/wiki/%E5%AE%87%E5%AE%99%E9%96%8B%E7%99%BA' \
		-u  'http://ja.wikipedia.org/wiki/%E5%AE%87%E5%AE%99%E9%96%8B%E7%99%BA%E7%AB%B6%E4%BA%89' \
		-u  'http://ja.wikipedia.org/wiki/%E5%AE%87%E5%AE%99%E6%8E%A2%E6%9F%BB%E6%A9%9F' \
		-u  'http://ja.wikipedia.org/wiki/%E6%9C%88%E9%9D%A2%E8%BB%8A' \
		-u  'http://ja.wikipedia.org/wiki/%E3%82%A2%E3%83%9D%E3%83%AD%E8%A8%88%E7%94%BB' \
		 \
		-u  'http://ja.wikipedia.org/wiki/%E9%82%84%E5%85%83' \
		-u  'http://ja.wikipedia.org/wiki/%E3%83%92%E3%83%89%E3%83%AD%E3%82%AD%E3%82%B7%E5%8C%96%E5%90%88%E7%89%A9' \
		-u  'http://ja.wikipedia.org/wiki/%E6%A0%B9%E3%81%AE%E8%AA%AC' \
		-u  'http://ja.wikipedia.org/wiki/%E6%9C%89%E6%A9%9F%E5%8C%96%E5%AD%A6' \
		-u  'http://ja.wikipedia.org/wiki/%E6%B0%B4%E5%92%8C%E7%89%A9' \
		-u  'http://ja.wikipedia.org/wiki/%E8%8A%B3%E9%A6%99%E5%8C%96%E5%90%88%E7%89%A9' \
		-u  'http://ja.wikipedia.org/wiki/%E5%8D%8A%E5%90%88%E6%88%90' \
		-u  'http://ja.wikipedia.org/wiki/%E6%BA%B6%E5%AA%92' \
		 \
		-u  'http://ja.wikipedia.org/wiki/%E6%94%BF%E6%B2%BB' \
		-u  'http://ja.wikipedia.org/wiki/%E7%B5%B1%E6%B2%BB' \
		-u  'http://ja.wikipedia.org/wiki/%E7%A4%BE%E4%BC%9A' \
		-u  'http://ja.wikipedia.org/wiki/%E6%94%BF%E6%B2%BB%E5%AD%A6' \
		-u  'http://ja.wikipedia.org/wiki/%E5%AE%9F%E8%A8%BC%E6%94%BF%E6%B2%BB%E7%90%86%E8%AB%96' \
		-u  'http://ja.wikipedia.org/wiki/%E5%A4%A7%E8%87%A3%E6%94%BF%E5%8B%99%E5%AE%98' \
		-u  'http://ja.wikipedia.org/wiki/%E5%86%85%E9%96%A3%E5%BA%9C' \
		-u  'http://ja.wikipedia.org/wiki/%E6%9D%A1%E4%BE%8B' \
		 \
		-u  'http://ja.wikipedia.org/wiki/%E3%82%B9%E3%83%9A%E3%82%A4%E3%83%B3%E5%86%85%E6%88%A6' \
		-u  'http://ja.wikipedia.org/wiki/%E5%86%85%E6%88%A6' \
		-u  'http://ja.wikipedia.org/wiki/%E3%83%AD%E3%82%B7%E3%82%A2%E5%86%85%E6%88%A6' \
		-u  'http://ja.wikipedia.org/wiki/%E6%88%8A%E8%BE%B0%E6%88%A6%E4%BA%89' \
		-u  'http://ja.wikipedia.org/wiki/%E3%82%A4%E3%82%A8%E3%83%A1%E3%83%B3%E5%86%85%E6%88%A6' \
		-u  'http://ja.wikipedia.org/wiki/%E3%82%A2%E3%83%B3%E3%82%B4%E3%83%A9%E5%86%85%E6%88%A6' \
		-u  'http://ja.wikipedia.org/wiki/%E3%83%AB%E3%83%AF%E3%83%B3%E3%83%80%E5%86%85%E6%88%A6' \
		-u  'http://ja.wikipedia.org/wiki/%E3%82%B9%E3%83%BC%E3%83%80%E3%83%B3%E5%86%85%E6%88%A6' \
		-u  'http://ja.wikipedia.org/wiki/%E3%83%AC%E3%83%90%E3%83%8E%E3%83%B3%E5%86%85%E6%88%A6' \

}

HTMLDATAJS="${CURDIR}/data/htmldata.json"
TESTDATAJS="${CURDIR}/data/testdata.json"
if [ "$1" == "" ]; then
		fetch_samples
fi
#PRIMARY=`${MONGO_SHELL} ${MONGO_NODE} --quiet ${CURDIR}/../lib/utils.js ${CURDIR}/../lib/getprimary.js | tail -n 1`

echo '=== COMVERT FROM HTML TO TEXT (test.testdoc.html => test.testdoc ) ==='
./htmlmon/htmlpick.js -m '127.0.0.1:27017/htmlmon.samplehtml' -o '127.0.0.1:27017/htmlmon.sampledoc' -C
./htmlmon/htmlpick.js -m '127.0.0.1:27017/htmlmon.samplehtml' -o '127.0.0.1:27017/htmlmon.sampledoc' -j 4

#rm ${TESTDATAJS}
#${MONGO_EXPORT} -h ${PRIMARY} -d test -c testdoc.html -f _id,body | while read -r readline ;do echo ${readline} | node ${CURDIR}/parsehtml.js -m >> ${TESTDATAJS}; done
##${MONGO_EXPORT} -h ${PRIMARY} -d test -c testdoc.html -f _id,body | while read readline ;do echo ${readline} | sed -e 's/"/\\"/g' | node ${CURDIR}/parsehtml.js -m >> ${TESTDATAJS}; done
#
#${MONGO_IMPORT} -h ${PRIMARY} --drop -d test -c testdoc --file ${TESTDATAJS}
