#!/usr/bin/env bash
CURDIR=`dirname $0`
source $CURDIR/../../mongo.env

usage (){
cat<<USAGE
Usage :
  vectorize.sh [options]

Summary:
  This is an automation script

  Calculate the TF/IDF from tokens in the specified collection.
  

Options :
    -h, --help                : This message
    -s, --source      ns      : Target collection ns
    -t, --threshold   float   : IDF threashold minimum proportion (defalut : 0.0)
    -l, --limit       float   : IDF threashold maximum proportion (defalut : 0.40)
    -v, --verb-only           : Pickup verb only
    -j, --jobs        num     : Number of jobs
USAGE
  exit $1
}

OPTIONS=`getopt -o hs:t:l:vj:C --long help,source:,threshold:,limit:,verb-only,jobs:,clearjob, -- "$@"`

if [ $? != 0 ] ; then
  exit 1
fi
eval set -- "$OPTIONS"
while true; do
    OPTARG=$2
    case $1 in
				-h|--help)       usage 0 ;;
				-s|--source)     SRC="${OPTARG}";shift;;
				-t|--threshold)  THRESHOLD="${OPTARG}";shift;;
				-l|--limit)      LIMIT="${OPTARG}"shift;;
				-v|--verb-only)  VERB=" -v ";;
				-j|--jobs)       JOBS=" -j ${OPTARG} ";shift;;
				--) shift;break;;
				# *) echo "Internal error! " >&2; exit 1 ;;
    esac
		shift
done


SRCDB=`echo ${SRC} | sed -e 's/^\([^\.]\+\)\.\(.\+\)/\1/'`
SRCCOL=`echo ${SRC} | sed -e 's/^\([^\.]\+\)\.\(.\+\)/\2/'`

TF=${SRCDB}'.vector.tf.'${SRCCOL}
DF=${SRCDB}'.vector.df.'${SRCCOL}
IDF=${SRCDB}'.vector.idf.'${SRCCOL}
TFIDF=${SRCDB}'.vector.tfidf.'${SRCCOL}

$CURDIR/tf.sh    -C -s ${SRC} -o ${TF} 
$CURDIR/tf.sh       -s ${SRC} -o ${TF}  ${JOBS}
$CURDIR/df.sh    -C -s ${TF}  -o ${DF} 
$CURDIR/df.sh       -s ${TF}  -o ${DF}  ${JOBS}
$CURDIR/idf.sh   -C -s ${DF}  -o ${IDF}
$CURDIR/idf.sh      -s ${DF}  -o ${IDF} ${JOBS} ${VERB}
$CURDIR/tfidf.sh -C -s ${IDF} -o ${TFIDF}
$CURDIR/tfidf.sh    -s ${IDF} -o ${TFIDF} ${JOBS}





