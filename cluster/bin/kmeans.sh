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
USAGE
//    -q, --query       query   : Target document
  exit $1
}

EVAL=''

VFIELD="var _VFIELD = 'value';";
CFIELD="var _CFIELD  = 'value.loc';"


OPTIONS=`getopt -o hs:v:i:c: --long help,source:,vector-field:initial-cluster:,cluster-field:, -- "$@"`
if [ $? != 0 ] ; then
  exit 1
fi
eval set -- "$OPTIONS"
while true; do
    OPTARG=$2
    case $1 in
				-h|--help)       usage 0 ;;
				-s|--source)           EVAL="${EVAL}var _SRC='${OPTARG}';";shift;;
				-v|--vector-field)     VFIELD="var _FIELD=${OPTARG};";shift;;
				-i|--initial-cluster)  EVAL="${EVAL}var _CLUSTER='${OPTARG}';";shift;;
				-c|--cluster-field)    CFIELD="var _CFIELD=${OPTARG};";shift;;
				--) shift;break;;
				*) echo "Internal error! " >&2; exit 1 ;;
    esac
		shift
done

${MONGO_SHELL} ${MONGO_NODE} --quiet --eval "${EVAL}${VFIELD}${CFIELD}" ${CURDIR}/../../lib/utils.js ${CURDIR}/../lib/kmeans.js | grep -v '^loading file:'
