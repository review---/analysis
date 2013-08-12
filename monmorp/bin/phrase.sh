#!/usr/bin/env bash
CURDIR=`dirname $0`
source $CURDIR/../../mongo.env

usage (){
cat<<USAGE
Usage :
  phrase.sh [options]

Summary:
  Analyze phrases from tokenized collection by using C-VALUE.

Options :
    -h, --help                : This message
    -s, --source      ns      : Target collection ns > The results of the tokenize.jp.js
    -o, --output      ns      : Output collection ns
    -k, --key-filed   name    : Key field      (default : 'd')
    -w, --word-field  name    : Word field     (default : 'c')
    -j, --jobs        num     : Number of jobs
    -C, --clearjob            : Clear job control info. (Kick once before start parse)
USAGE
  exit $1
}


EVAL=''
OUT="var _OUT='';"
KEY="var _KEY='d';"
WORD="var _WORD='c';"
CJOB="var _CJOB=false;"
CLEAR=
JOBS=''

OPTIONS=`getopt -o hs:o:k:w:j:C --long help,source:,output:,key-field:,word-field:,jobs:,clearjob, -- "$@"`
if [ $? != 0 ] ; then
  exit 1
fi
eval set -- "$OPTIONS"
while true; do
    OPTARG=$2
    case $1 in
				-h|--help)       usage 0 ;;
				-s|--source)     EVAL="${EVAL}var _SRC='${OPTARG}';";shift;;
				-o|--output)     OUT="var _OUT='${OPTARG}';";shift;;
				-k|--key-field)  KEY="var _KEY=${OPTARG};";shift;;
				-w|--word-field) WORD="var _WORD=${OPTARG};";shift;;
				-j|--jobs)       JOBS="${OPTARG}";shift;;
				-C|--clearjob)   CLEAR="1";;
				--) shift;break;;
				# *) echo "Internal error! " >&2; exit 1 ;;
    esac
		shift
done

if [ "${CLEAR}" = "1" ];then
		CJOB="var _CJOB=true;"
		JOBS=''
fi

if [ "${JOBS}" = "" ];then
		${MONGO_SHELL} ${MONGO_NODE} --quiet --eval "${EVAL}${OUT}${KEY}${WORD}${QUERY}${CJOB}" ${CURDIR}/../../lib/utils.js ${CURDIR}/../lib/dictionary.js ${CURDIR}/../lib/morpho.js ${CURDIR}/../lib/phrase.js | grep -v '^loading file:'
		exit
fi
WAIT=''
EXEC=''
for i in `eval echo "{1..${JOBS}}"`; do
		EXEC="${EXEC}`echo ${MONGO_SHELL} ${MONGO_NODE} --quiet --eval \\"${EVAL}${OUT}${KEY}${WORD}${QUERY}${CJOB}\\" ${CURDIR}/../../lib/utils.js ${CURDIR}/../lib/dictionary.js ${CURDIR}/../lib/morpho.js ${CURDIR}/../lib/phrase.js` | grep -v '^loading file:' & WAIT=\"\${WAIT} \$!\";"
done
eval $EXEC
for p in $WAIT; do
		wait $p
done
