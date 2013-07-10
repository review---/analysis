#!/usr/bin/env bash
CURDIR=`dirname $0`
source $CURDIR/../../mongo.env

usage (){
cat<<USAGE
Usage :
  gendic.sh [options]

  Compile dictionary collection.
    1. Import from IPADIC when specified -i option
    2. Compile from 1. to specified collection.
    3. Some amendment.

Options :
    -h, --help       : This message.
    -D, --dictionary : Dictionary collection ns
    -i, --ipadic-dir : IPADIC directory path will get it by extacting ipadic-???.tar.gz. 
                        (ex> ../data/ipadic-2.7.0/
                     : Use old collection instead of clean-created collection if this option is not specfied.
    -n, --nheads     : #Charactors of word in index.

How to get IPA Dictionary

   pushd ./data
   wget http://iij.dl.sourceforge.jp/ipadic/24435/ipadic-2.7.0.tar.gz
   tar xzf ipadic-2.7.0.tar.gz
   popd

USAGE
  exit $1
}

IPADIC=''
DIC='var _DIC="analysis.dictionary";'
NHEADS='var _NHEADS = 2;'
#NHEADS='var _NHEADS = 3;'
OPTIONS=`getopt -o hD:i:n: --long help,dictionary:ipadic-dir:,nheads: -- "$@"`
if [ $? != 0 ] ; then
  exit 1
fi
eval set -- "$OPTIONS"
while true; do
    OPTARG=$2
    case $1 in
				-h|--help)       usage 0 ;;
				-D|--dictionary) DIC="var _DIC='${OPTARG}';";shift;;
				-i|--ipadic-dir) IPADIC="--ipadic='${OPTARG}'";shift;;
				-n|--nheads)     NHEADS="var _NHEADS=${OPTARG};";shift;;
				--) shift;break;;
				*) echo "Internal error! " >&2; exit 1 ;;
    esac
		shift
done

DICJS="${CURDIR}/../data/dic.json"
if [ "$IPADIC" != "" ]; then
		echo '=== PARSE IPADIC ==='
		perl ${CURDIR}/../lib/parsedic.pl $IPADIC > ${DICJS}
		echo '=== IMPORT IPADIC ==='
		PRIMARY=`${MONGO_SHELL} ${MONGO_NODE} --quiet ${CURDIR}/../lib/utils.js ${CURDIR}/../lib/getprimary.js | tail -n 1`
		${MONGO_IMPORT} -h ${PRIMARY} --drop -d analysis -c dictionary.ipadic --file ${DICJS}
fi
echo '=== BUILDING DICTIONARY ==='
${MONGO_SHELL} ${MONGO_NODE} --quiet --eval "${DIC}${NHEADS}" ${CURDIR}/../lib/utils.js ${CURDIR}/../lib/morpho.js ${CURDIR}/../lib/gendic.js
echo '=== AMEND DICTIONARY ==='
${MONGO_SHELL} ${MONGO_NODE} --quiet --eval "${DIC}${NHEADS}" ${CURDIR}/../lib/utils.js ${CURDIR}/../lib/morpho.js ${CURDIR}/../lib/amenddic.js
echo '=== COMPLETE ==='
