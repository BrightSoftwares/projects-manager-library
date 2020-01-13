function partition(array, begin, end, pivot, by, ord)
{
  var piv=array[pivot][by];
  array.swap(pivot, end-1);
  var store=begin;
  var ix;
  for(ix=begin; ix<end-1; ++ix) {
      if(ord=="ASC"?(array[ix][by]<=piv):(array[ix][by]>=piv)) {
          array.swap(store, ix);
          ++store;
      }
  }
  array.swap(end-1, store);

  return store;
}

function quick_sort(array, begin, end, by, ord)
{
  if(end-1>begin) {
      var pivot=begin+Math.floor(Math.random()*(end-begin));

      pivot=partition(array, begin, end, pivot, by, ord);

      quick_sort(array, begin, pivot, by, ord);
      quick_sort(array, pivot+1, end, by, ord);
  }
}
/*
 * Use this fonction to sort a class componed table
 * @param array : the array to sort
 * @param by : the method/propertie to use for sorting items
 * @param ord : 
 */
function qsort(array, by, ord){
  quick_sort(array, 0, array.length, by, ord);
}
//Allow to swap two values in a table object by there indexes
Array.prototype.swap=function(a, b)
{
  var tmp=this[a];
  this[a]=this[b];
  this[b]=tmp;
}