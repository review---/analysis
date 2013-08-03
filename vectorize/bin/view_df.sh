#!/usr/bin/env bash
CURDIR=`dirname $0`
source $CURDIR/../../mongo.env

usage (){
cat<<USAGE
Usage :
  view_df.sh [options]

Options :
    -h, --help                : This message
    -s, --source      ns      : DF collection ns
USAGE
  exit $1
}

EVAL=''
VERBOSE="var _VERBOSE=false;"

OPTIONS=`getopt -o hs:FV --long help,source:,verbose, -- "$@"`
if [ $? != 0 ] ; then
  exit 1
fi
eval set -- "$OPTIONS"
while true; do
    OPTARG=$2
    case $1 in
				-h|--help)       usage 0 ;;
				-s|--source)     EVAL="${EVAL}var _SRC='${OPTARG}';";shift;;
				-V|--verbose)    VERBOSE="var _VERBOSE=true;";;
				--) shift;break;;
				*) echo "Internal error! " >&2; exit 1 ;;
    esac
		shift
done

${MONGO_SHELL} ${MONGO_NODE} --quiet --eval "${EVAL}${VERBOSE}" ${CURDIR}/../../lib/utils.js ${CURDIR}/../../monmorp/lib/dictionary.js ${CURDIR}/../lib/view_df.js | grep -v '^loading file:'
