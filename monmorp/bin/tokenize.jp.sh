#!/usr/bin/env bash
CURDIR=`dirname $0`
source $CURDIR/../../mongo.env

usage (){
cat<<USAGE
Usage :
  tokenize.jp.sh [options]

Summary:
  Parse Japanese sentense by morphological analysis.
  It use "analysis.dictionary" collelction as dictionary by default.

    Use "gendic.sh" to create dictionary collection.

Options :
    -h, --help                : This message
    -d, --dictionary  ns      : Dictionary collection ns
    -s, --source      ns      : Target collection ns
    -f, --field       name    : Target field
    -q, --query       query   : Target document
    -o, --output      ns or - : Output collection ns
                              :  Output STDIO when specfy '-'
    -i, --input       string  : Input sentense directly
    -j, --jobs        num     : Number of jobs
    -C, --clearjob            : Clear job control info. (Kick once before start parse)
USAGE
  exit $1
}


EVAL=''
OUT="var _OUT='';"
VERBOSE='var _VERBOSE=false;'
DIC="var _DIC='analysis.dictionary';"
QUERY='var _QUERY={};'
SENTENSE='var _SENTENSE=false;'
CJOB="var _CJOB=false;"
CLEAR=
JOBS=''
OPTIONS=`getopt -o hd:s:o:f:q:i:j:CV --long help,dictionary:,source:,output:,field:,query:,input:,jobs:,clearjob,verbose, -- "$@"`
if [ $? != 0 ] ; then
  exit 1
fi
eval set -- "$OPTIONS"
while true; do
    OPTARG=$2
    case $1 in
				-h|--help)       usage 0 ;;
				-d|--dictionary) DIC="var _DIC='${OPTARG}';";shift;;
				-s|--source)     EVAL="${EVAL}var _SRC='${OPTARG}';";shift;;
				-o|--output)     OUT="var _OUT='${OPTARG}';";shift;;
				-f|--field)      EVAL="${EVAL}var _FIELD='${OPTARG}';";shift;;
				-q|--query)      QUERY="var _QUERY=${OPTARG};";shift;;
				-i|--input)      SENTENSE="var _SENTENSE='`echo \"${OPTARG}\"|tr "\n" " "`';";shift;;
				-j|--jobs)       JOBS="${OPTARG}";shift;;
				-C|--clearjob)   CLEAR="1";;
				-V|--verbose)    VERBOSE="var _VERBOSE=true;";;
				--) shift;break;;
				*) echo "Internal error! " >&2; exit 1 ;;
    esac
		shift
done

if [ "${CLEAR}" = "1" ];then
		CJOB="var _CJOB=true;"
		JOBS=''
fi

echo '    DOCID                  : #COMPARES'
if [ "${JOBS}" = "" ];then
		${MONGO_SHELL} ${MONGO_NODE} --quiet --eval "${EVAL}${OUT}${VERBOSE}${DIC}${QUERY}${SENTENSE}${CJOB}" ${CURDIR}/../../lib/utils.js ${CURDIR}/../lib/dictionary.js ${CURDIR}/../lib/morpho.js ${CURDIR}/../lib/jptokenizer.js ${CURDIR}/../lib/tokenize.js | grep -v '^loading file:'
		exit
fi
WAIT=''
EXEC=''
for i in `eval echo "{1..${JOBS}}"`; do
		EXEC="${EXEC}`echo ${MONGO_SHELL} ${MONGO_NODE} --quiet --eval \\"${EVAL}${OUT}${VERBOSE}${DIC}${QUERY}${SENTENSE}${CJOB}\\" ${CURDIR}/../../lib/utils.js ${CURDIR}/../lib/dictionary.js ${CURDIR}/../lib/morpho.js ${CURDIR}/../lib/jptokenizer.js ${CURDIR}/../lib/tokenize.js;` | grep -v '^loading file:' & WAIT=\"\${WAIT} \$!\";"
done
eval $EXEC
for p in $WAIT; do
		wait $p
done
