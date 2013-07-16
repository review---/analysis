#!/usr/bin/env bash
CURDIR=`dirname $0`
source $CURDIR/../../mongo.env

usage (){
cat<<USAGE
Usage :
  viewcluster.sh [options]

Options :
    -h, --help                : This message
    -d, --dictionary  ns      : Dictionary collection ns
    -s, --source      ns      : Target collection ns
    -v, --verbose             : 
USAGE
  exit $1
}

EVAL=''

DIC="var _DIC     = 'analysis.dictionary';"
VERBOSE="var _VERBOSE=false;"

OPTIONS=`getopt -o hs:v:t:V --long help,source:,verbose, -- "$@"`
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
				-V|--verbose)    VERBOSE="var _VERBOSE=true;";;
				--) shift;break;;
				*) echo "Internal error! " >&2; exit 1 ;;
    esac
		shift
done

${MONGO_SHELL} ${MONGO_NODE} --quiet --eval "${EVAL}${DIC}${VERBOSE}" ${CURDIR}/../../lib/utils.js ${CURDIR}/../lib/viewcluster.js | grep -v '^loading file:'
