const PROCESSED = Symbol("walker processed");

function performTextHole(text) {
  return (text || "").replaceAll(/trump/gi, "ASSHOLE");
}

function shouldHole(text) {
  return (text || "").toLowerCase().includes("trump")
}

function holeSimilarLinks(global, node) {
  // find a link
  const link = node.closest("a");
  if (link) {
    const href = link.getAttribute("href");
    if (href) {
      // find all of the similar links
      const similar = global.document.querySelectorAll(`a[href="${href}"]`);
      for (const sim of similar) {
        // Be better
        sim.setAttribute("style", "border:4px solid magenta!");
        node[PROCESSED] = true;
      }
    }
  }
}

async function performMemoryHole(global) {
  // walk everything looking for the thing to memory hole
  const textWalker = global.document.createTreeWalker(global.document, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      console.log(node);
      if (node[PROCESSED]) {
        return NodeFilter.FILTER_SKIP;
      }
      return shouldHole(node.textContent) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });

    
  while (textWalker.nextNode()) {
    const node = textWalker.currentNode;
    // mark the node as processed so it isn't scanned again
    node[PROCESSED] = true;
    // replace the string
    node.textContent = performTextHole(node.textContent);
    // perform the link matching magic
    holeSimilarLinks(global, node.parentElement);
  }

  // images are also problematic
  const imgWalker = global.document.createTreeWalker(global.document, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      if (node[PROCESSED]) {
        return NodeFilter.FILTER_SKIP;
      }
      if (node.nodeName.toLowerCase() !== "img") {
        return NodeFilter.FILTER_REJECT
      }
      // just check alt text for now, could maybe look at URLs?
      return shouldHole(node.getAttribute("alt")) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  
    
  while (imgWalker.nextNode()) {
    const node = imgWalker.currentNode;
    // mark the node as processed so it isn't scanned again
    node[PROCESSED] = true;
    // replace the image
    node.setAttribute("alt", "SOME ASSHOLE");
    
    // perform the link matching magic
    holeSimilarLinks(global, node);
  }
}


// Actually initialize
(async (global) => {
  // watch the whole dom for node changes that might contain the text.
  const options = {
    subtree: true,
    childTree: true,
  }
  const observer = new MutationObserver(async (mutationList) => {
    // could probably just target the things that mutated, but for now hamfistedly walk the whole tree.
    await performMemoryHole(global);
  });
  
  await performMemoryHole(global);
})(globalThis);