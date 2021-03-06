import * as $ from 'jquery'

window.minuu = {
  'start': __startMinuuInternal,
  'ready': function(callback){
    this.readyPromise.then(callback)
  }
}

/**
 * Starter function that can handle nothing, jquery object, or string selector
 * @param       {optional} $elm String, jQuery Object, or nothing
 * @constructor
 */
function __startMinuuInternal($elm){
  if($elm instanceof jQuery){
    this.readyPromise = loadContent($elm)
  }else
  if(typeof $elm == 'string'){
    this.readyPromise = loadContent($(selector))
  }else
  if(typeof $elm == 'undefined'){
    this.readyPromise = checkChildren($(document))
  }else{
    $.Deferred().reject()
  }
}

loadContent = function($elm, path = ''){

  // trigger elm.loadingStart
  sendEvent('loading', 'loading element through Minuu', $elm)
  const elmLoad = $.Deferred()


  let includeData = $($elm).data('include')

  if(includeData == undefined){
    console.warn('Minuu cannot start on an element without a data-include tag')
    return
  }

  if(path != ''){
    includeData = path.concat(includeData)
  }

  if(includeData.startsWith('folder:')){
    includeData = includeData.replace('folder:','').concat('/')
    path = path.concat(includeData)
    includeData = path.concat('index')
  }

  const file = `views/${includeData}.html`

  $($elm).load(file, function(responseText, textStatus, req){

    if(textStatus == 'success'){
      // trigger elm.loadingSuccess
      sendEvent('success', 'element loaded successfuly through Minuu', $elm)
      checkChildren($elm, path).then(()=>{ elmLoad.resolve($elm) })
    }
    else
    if(textStatus == 'error'){
      // trigger elm.loadingError
      sendEvent('error', 'element failed to load through Minuu', $elm)
      elmLoad.reject()
    }

    // trigger elm.loadingComplete
    sendEvent('complete', 'element finished loading through Minuu', $elm)


  })

  return elmLoad.promise()
}


checkChildren = function($elm, path){
  const children = $elm.find('[data-include]')

  if(children.length == 0){
    return $.Deferred().resolve()
  }

  const promisedArray = children.map(function(){
    return loadContent($(this), path)
  })

  return $.when(...promisedArray)
}

/**
 * sends events to document root
 * @param  {String} eventName name of event. will be prefixed with "minuu:"
 * @param  {String} eventMsg  descriptor for event. optional.
 * @param  {object} elm       Jquery DOM node that the event references
 * @return {event}            returns the dispatchEvent return.
 */
sendEvent = function(eventName, eventMsg = '', elm = {}){
    event = new CustomEvent(eventName, {msg: eventMsg, element: elm})
    return document.dispatchEvent(event)
}



// DONE: extract events into their own function
// DONE: extract loadContent into two separate functions,
//       one that loads, one that recurses. this way, start()
//       can call the recursion function and not worry about
//       iterating through children.
// NOPE: finish logic for minuu.ready() using document.minuu:complete event
// DONE: use RXJS or promises to make sure the complete event
//       fires at the appropriate time after all async children
// TODO: add npm vs web usage in docs
