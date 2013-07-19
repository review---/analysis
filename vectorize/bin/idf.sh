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
USAGE
//    -q, --query       query   : Target document
  exit $1
}


EVAL=''
QUERY='var _QUERY={};'
KEY="var _KEY='d';"
WORD="var _WORD='c';"

OPTIONS=`getopt -o hs:k:w:q: --long help,source:,key-field:,word-field:,query:, -- "$@"`
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
				--) shift;break;;
				*) echo "Internal error! " >&2; exit 1 ;;
    esac
		shift
done

${MONGO_SHELL} ${MONGO_NODE} --quiet --eval "${EVAL}${KEY}${WORD}${QUERY}" ${CURDIR}/../../lib/utils.js ${CURDIR}/../lib/vectorize.js | grep -v '^loading file:'
