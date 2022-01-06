/* @flow */

/**
 * Creates a mapper that maps components used during a server-side render
 * to async chunk files in the client-side build, so that we can inline them
 * directly in the rendered HTML to avoid waterfall requests.
 */

import type { ClientManifest } from './index'

export type AsyncFileMapper = (files: Array<string>) => Array<string>;

export function createMapper (
  clientManifest: ClientManifest
): AsyncFileMapper {
  // map server-side moduleIds to client-side files
  return function mapper (moduleIds: Array<string>): Array<string> {
    const chunks = new Set();

    moduleIds.forEach(mid => {
      if (clientManifest.moduleChunk[mid]) {
        chunks.add(clientManifest.moduleChunk[mid])
      }
    })

    let chunkSiblingsToCheck = Array.from(chunks);
    while (chunkSiblingsToCheck.length) {
      const chunk = chunkSiblingsToCheck.shift();
      const siblings = clientManifest.chunkSiblings[chunk];
      if (siblings) {
        siblings.forEach(sid => {
          chunks.add(sid);
        });
        chunkSiblingsToCheck = chunkSiblingsToCheck.filter(cid => !siblings.includes(cid));
      }
    }

    const files = new Set();
    Array.from(chunks).forEach(cid => {
      const chunkFiles = clientManifest.chunkFiles[cid];
      if (chunkFiles) {
        chunkFiles.forEach(file => {
          files.add(file);
        });
      }
    });

    return Array.from(files);
  }
}

