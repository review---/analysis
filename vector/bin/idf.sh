#!/usr/bin/env bash
CURDIR=`dirname $0`
source $CURDIR/../../mongo.env

usage (){
cat<<USAGE
Usage :
  idf.sh [options]

Options :
    -h, --help                : This message
    -s, --source      ns      : Target collection ns
    -k, --key-filed   name    : Key field      (default : 'd')
    -w, --word-field  name    : Word field     (default : 'c')
    -t, --threshold   float   : IDF threashold minimum proportion (defalut : 0.1)
    -l, --limit       float   : IDF threashold maximum proportion (defalut : 0.75)
USAGE
//    -q, --query       query   : Target document
  exit $1
}


EVAL=''
QUERY='var _QUERY={};'
KEY="var _KEY='d';"
WORD="var _WORD='c';"
THREASHOLD="var _THRESHOLD=0.1;"
LIMIT="var _LIMIT=0.75;"

OPTIONS=`getopt -o hs:k:w:t:l:q: --long help,source:,key-field:,word-field:,threshold:,limit:,query:, -- "$@"`
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
				-t|--threshold)  THRESHOLD="var _THRESHOLD=${OPTARG};";shift;;
				-l|--limit)      LIMIT="var _LIMIT=${OPTARG};";shift;;
				-q|--query)      QUERY="var _QUERY=${OPTARG};";shift;;
				--) shift;break;;
				*) echo "Internal error! " >&2; exit 1 ;;
    esac
		shift
done

${MONGO_SHELL} ${MONGO_NODE} --quiet --eval "${EVAL}${KEY}${WORD}${THREASHOLD}${LIMIT}${QUERY}" ${CURDIR}/../../lib/utils.js ${CURDIR}/../lib/idf.js | grep -v '^loading file:'
