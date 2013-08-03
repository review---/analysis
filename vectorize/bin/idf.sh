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
    -t, --threshold   float   : IDF threashold minimum proportion (defalut : 0.0)
    -l, --limit       float   : IDF threashold maximum proportion (defalut : 0.40)
    -v, --verb-only           : Pickup verb only
    -j, --jobs        num     : Number of jobs
    -C, --clearjob            : Clear job control info. (Kick once before start parse)
USAGE
  exit $1
}


EVAL=''
THREASHOLD="var _THRESHOLD=0.0;"
LIMIT="var _LIMIT=0.40;"
VERB="var _VERB=false;"
CJOB="var _CJOB=false;"
CLEAR=
JOBS=''

OPTIONS=`getopt -o hs:t:l:vj:C --long help,source:,threshold:,limit:,verb-only,jobs:,clearjob, -- "$@"`
if [ $? != 0 ] ; then
  exit 1
fi
eval set -- "$OPTIONS"
while true; do
    OPTARG=$2
    case $1 in
				-h|--help)       usage 0 ;;
				-s|--source)     EVAL="${EVAL}var _SRC='${OPTARG}';";shift;;
				-t|--threshold)  THRESHOLD="var _THRESHOLD=${OPTARG};";shift;;
				-l|--limit)      LIMIT="var _LIMIT=${OPTARG};";shift;;
				-v|--verb-only)  VERB="var _VERB=true;";;
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
		${MONGO_SHELL} ${MONGO_NODE} --quiet --eval "${EVAL}${THREASHOLD}${LIMIT}${VERB}${CJOB}" ${CURDIR}/../../lib/utils.js ${CURDIR}/../lib/vectorize.js ${CURDIR}/../lib/idf.js | grep -v '^loading file:'
		exit
fi
WAIT=''
EXEC=''
for i in `eval echo "{1..${JOBS}}"`; do
		EXEC="${EXEC}`echo ${MONGO_SHELL} ${MONGO_NODE} --quiet --eval \\"${EVAL}${THREASHOLD}${LIMIT}${VERB}${CJOB}\\" ${CURDIR}/../../lib/utils.js ${CURDIR}/../lib/vectorize.js ${CURDIR}/../lib/idf.js` | grep -v '^loading file:' & WAIT=\"\${WAIT} \$!\";"
done
eval $EXEC
for p in $WAIT; do
		wait $p
done
