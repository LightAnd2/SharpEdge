const HIDDEN_BOOKS = new Set(['b'])

export function isVisibleBook(book) {
  return !!book && !HIDDEN_BOOKS.has(String(book).toLowerCase())
}

export function filterVisibleBooks(books = []) {
  return books.filter(isVisibleBook)
}
