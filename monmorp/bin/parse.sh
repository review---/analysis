#!/usr/bin/env bash
CURDIR=`dirname $0`
source $CURDIR/../../mongo.env

usage (){
cat<<USAGE
Usage :
  parse.sh [options]

  Parse Japanese sentense by morphological analysis.
  It use "analysis.dictionary" collelction as dictionary by default.

    Use "gendic.sh" to create dictionary collection.

Options :
    -h, --help       : This message
    -D, --dictionary : Dictionary collection ns
    -c, --collection : Target collection ns
    -f, --field      : Target field
    -q, --query      : Target document
    -o, --output     : Output collection ns
    -i, --input      : Input sentense directly
                     :  Output STDIO when specfy '-'
USAGE
  exit $1
}


EVAL=''
VFLG='var _VFLG=false;'
DIC='var _DIC="analysis.dictionary";'
QUERY='var _QUERY={};'
SENTENSE='var _SENTENSE=false;'
OPTIONS=`getopt -o hD:c:f:q:o:i:V --long help,dictionary:,collection:,field:,query:,output:,input:,verbose, -- "$@"`
if [ $? != 0 ] ; then
  exit 1
fi
eval set -- "$OPTIONS"
while true; do
    OPTARG=$2
    case $1 in
				-h|--help)       usage 0 ;;
				-D|--dictionary) DIC="var _DIC='${OPTARG}';";shift;;
				-c|--collection) EVAL="${EVAL}var _COL='${OPTARG}';";shift;;
				-f|--field)      EVAL="${EVAL}var _FIELD='${OPTARG}';";shift;;
				-q|--query)      QUERY="var _QUERY=${OPTARG};";shift;;
				-o|--output)     EVAL="${EVAL}var _OUT='${OPTARG}';";shift;;
				-i|--input)      SENTENSE="var _SENTENSE='${OPTARG}';";shift;;
				-V|--verbose)    VFLG="var _VFLG=true;";;
				--) shift;break;;
				*) echo "Internal error! " >&2; exit 1 ;;
    esac
		shift
done
${MONGO_SHELL} --quiet --eval "${EVAL}${VFLG}${DIC}${QUERY}${SENTENSE}" ${CURDIR}/../lib/utils.js ${CURDIR}/../lib/morpho.js ${CURDIR}/../lib/parse.js

