#!/usr/bin/env bash
CURDIR=`dirname $0`
source $CURDIR/../../mongo.env

usage (){
cat<<USAGE
Usage :
  kmeans.sh [options]

Options :
    -h, --help                : This message
    -s, --source         ns   : Target collection ns
    -v, --vector-filed   name : Vector field                      (defalut : 'value')
    -i, --inital-cluster ns   : Cluster collection ns (Initial centers)
    -c, --cluster-filed  name : Vector field                      (defalut : 'value')
    -j, --jobs        num     : Number of jobs
    -C, --clearjob            : Clear job control info. (Kick once before start parse)
USAGE
//    -q, --query       query   : Target document
  exit $1
}

EVAL=''

VFIELD="var _VFIELD = 'value';";
CFIELD="var _CFIELD  = 'value.loc';"

CJOB="var _CJOB=false;"
CLEAR=
JOBS=''


OPTIONS=`getopt -o hs:v:i:c:j:C --long help,source:,vector-field:initial-cluster:,cluster-field:,jobs:,clearjob, -- "$@"`
if [ $? != 0 ] ; then
  exit 1
fi
eval set -- "$OPTIONS"
while true; do
    OPTARG=$2
    case $1 in
				-h|--help)       usage 0 ;;
				-s|--source)           EVAL="${EVAL}var _SRC='${OPTARG}';";shift;;
				-v|--vector-field)  VFIELD="var _VFIELD='${OPTARG}';";shift;;
				-i|--initial-cluster)  EVAL="${EVAL}var _CLUSTER='${OPTARG}';";shift;;
				-c|--cluster-field)    CFIELD="var _CFIELD='${OPTARG}';";shift;;
				-j|--jobs)       JOBS="${OPTARG}";shift;;
				-C|--clearjob)   CLEAR="1";;
				--) shift;break;;
				*) echo "Internal error! " >&2; exit 1 ;;
    esac
		shift
done

if [ "${CLEAR}" = "1" ];then
		CJOB="var _CJOB=true;"
		JOBS=''
fi

if [ "${JOBS}" = "" ];then
		${MONGO_SHELL} ${MONGO_NODE} --quiet --eval "${EVAL}${VFIELD}${CFIELD}${CJOB}" ${CURDIR}/../../lib/utils.js ${CURDIR}/../lib/kmeans.js.bk | grep -v '^loading file:'
		exit
fi
WAIT=''
EXEC=''
for i in `eval echo "{1..${JOBS}}"`; do
		EXEC="${EXEC}`echo ${MONGO_SHELL} ${MONGO_NODE} --quiet --eval \\"${EVAL}${VFIELD}${CFIELD}${CJOB}\\" ${CURDIR}/../../lib/utils.js ${CURDIR}/../lib/kmeans.js` | grep -v '^loading file:' & WAIT=\"\${WAIT} \$!\";"
done
eval $EXEC
for p in $WAIT; do
		wait $p
done
