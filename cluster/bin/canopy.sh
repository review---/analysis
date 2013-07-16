#!/usr/bin/env bash
CURDIR=`dirname $0`
source $CURDIR/../../mongo.env

usage (){
cat<<USAGE
Usage :
  canopy.sh [options]

Options :
    -h, --help                : This message
    -s, --source       ns     : Target collection ns
    -v, --vector-filed name   : Vector field                      (defalut : 'value')
    -t, --threshold    float  : Cluster member minimum threashold (defalut : 0.1)
                              :  Ignoring clusters having member less than "#all-member / #cluster * threshold"
    -2, --t2   float          : T2 cluster redius                 (defalut : 1.33)
    -1, --t1   float          : T1 have to be bigger than T2      (defalut : 1.34)
USAGE
  exit $1
}

EVAL=''
VFIELD="var _VFIELD = 'value';";
THREASHOLD="var _THRESHOLD=0.1;"
T1="var _T1=1.33;"
T2="var _T2=1.34;"


OPTIONS=`getopt -o hs:v:t:1:2: --long help,source:,vector-field:,word-field:,threshold:,t1:,t2:, -- "$@"`
if [ $? != 0 ] ; then
  exit 1
fi
eval set -- "$OPTIONS"
while true; do
    OPTARG=$2
    case $1 in
				-h|--help)       usage 0 ;;
				-s|--source)        EVAL="${EVAL}var _SRC='${OPTARG}';";shift;;
				-v|--vector-field)  VFIELD="var _VFIELD=${OPTARG};";shift;;
				-t|--threshold)     THRESHOLD="var _THRESHOLD=${OPTARG};";shift;;
				-1|--t1)            T1="var _T1=${OPTARG};";shift;;
				-2|--t2)            T2="var _T2=${OPTARG};";shift;;
				--) shift;break;;
				*) echo "Internal error! " >&2; exit 1 ;;
    esac
		shift
done

${MONGO_SHELL} ${MONGO_NODE} --quiet --eval "${EVAL}${VFIELD}${THREASHOLD}${T1}${T2}" ${CURDIR}/../../lib/utils.js ${CURDIR}/../lib/canopy.js | grep -v '^loading file:'
