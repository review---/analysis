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
    -t, --threshold   float   : IDF threashold (defalut : 1.0)
    -j, --jobs        num     : Number of jobs
    -C, --clearjob            : Clear job control info. (Kick once before start parse)
    -N, --normalize           : Normalize
USAGE
  exit $1
}


EVAL=''
QUERY='var _QUERY={};'
KEY="var _KEY='d';"
WORD="var _WORD='c';"
THREASHOLD="var _THRESHOLD=1.0;"
CJOB="var _CJOB=false;"
JOBS=''
NORMALIZE="var _NORMALIZE=false;"

OPTIONS=`getopt -o hs:k:w:t:q:j:CN --long help,source:,key-field:,word-field:,threshold:,query:,jobs:,clearjob,normailze, -- "$@"`
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
				-t|--threshold)  THRESHOLD="var _THRESHOLD=${OPTARG};";shift;;
				-j|--jobs)       JOBS="${OPTARG}";shift;;
				-C|--clearjob)   CJOB="var _CJOB=true;";;
				-N|--normalize)  NORMALIZE="var _NORMALIZE=true;";;
				--) shift;break;;
				*) echo "Internal error! " >&2; exit 1 ;;
    esac
		shift
done

if [ "${JOBS}" = "" ];then
		${MONGO_SHELL} ${MONGO_NODE} --quiet --eval "${EVAL}${KEY}${WORD}${THREASHOLD}${QUERY}${CJOB}${NORMALIZE}" ${CURDIR}/../../lib/utils.js ${CURDIR}/../lib/tfidf.js | grep -v '^loading file:'
		exit
fi
WAIT=''
EXEC=''
for i in `eval echo "{1..${JOBS}}"`; do
		EXEC="${EXEC}`echo ${MONGO_SHELL} ${MONGO_NODE} --quiet --eval \\"${EVAL}${KEY}${WORD}${THREASHOLD}${QUERY}${CJOB}${NORMALIZE}\\" ${CURDIR}/../../lib/utils.js ${CURDIR}/../lib/tfidf.js;` | grep -v '^loading file:' & WAIT=\"\${WAIT} \$!\";"
done
eval $EXEC
for p in $WAIT; do
		wait $p
done
