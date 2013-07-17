#!/usr/bin/env bash
CURDIR=`dirname $0`
source $CURDIR/../../mongo.env

usage (){
cat<<USAGE
Usage :
  tfidf.sh [options]

Options :
    -h, --help                : This message
    -s, --source      ns      : Target collection ns
    -k, --key-filed   name    : Key field      (default : 'd')
    -w, --word-field  name    : Word field     (default : 'c')
    -j, --jobs        num     : Number of jobs
    -C, --clearjob            : Clear job control info. (Kick once before start parse)
USAGE
  exit $1
}


EVAL=''
QUERY='var _QUERY={};'
KEY="var _KEY='d';"
WORD="var _WORD='c';"
CJOB="var _CJOB=false;"
JOBS=''

OPTIONS=`getopt -o hs:k:w:q:j:C --long help,source:,key-field:,word-field:,query:,jobs:,clearjob, -- "$@"`
if [ $? != 0 ] ; then
  exit 1
fi
eval set -- "$OPTIONS"
while true; do
    OPTARG=$2
    case $1 in
				-h|--help)       usage 0 ;;
				-s|--source)     EVAL="${EVAL}var _SRC='${OPTARG}';";shift;;
				-k|--key-field)  KEY="var _KEY=${OPTARG};";shift;;
				-w|--word-field) WORD="var _WORD=${OPTARG};";shift;;
				-q|--query)      QUERY="var _QUERY=${OPTARG};";shift;;
				-j|--jobs)       JOBS="${OPTARG}";shift;;
				-C|--clearjob)   CJOB="var _CJOB=true;";;
				--) shift;break;;
				*) echo "Internal error! " >&2; exit 1 ;;
    esac
		shift
done

if [ "${JOBS}" = "" ];then
		${MONGO_SHELL} ${MONGO_NODE} --quiet --eval "${EVAL}${KEY}${WORD}${QUERY}${CJOB}" ${CURDIR}/../../lib/utils.js ${CURDIR}/../lib/tfidf.js | grep -v '^loading file:'
		exit
fi
WAIT=''
EXEC=''
for i in `eval echo "{1..${JOBS}}"`; do
		EXEC="${EXEC}`echo ${MONGO_SHELL} ${MONGO_NODE} --quiet --eval \\"${EVAL}${KEY}${WORD}${QUERY}${CJOB}\\" ${CURDIR}/../../lib/utils.js ${CURDIR}/../lib/tfidf.js;` | grep -v '^loading file:' & WAIT=\"\${WAIT} \$!\";"
done
eval $EXEC
for p in $WAIT; do
		wait $p
done
