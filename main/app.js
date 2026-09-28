const VALID_STATUSES = ['want', 'reading', 'finished'];

function validateBook(body) {
  const errors = [];
  const clean = {};

  if (!body.title || !String(body.title).trim()) {
    errors.push('Title is required.');
  } else {
    clean.title = String(body.title).trim();
  }

  if (!body.author || !String(body.author).trim()) {
    errors.push('Author is required.');
  } else {
    clean.author = String(body.author).trim();
  }

  if (body.year !== undefined && body.year !== null && body.year !== '') {
    const y = Number(body.year);
    if (!Number.isInteger(y) || y < 0 || y > 2100) {
      errors.push('Year must be a valid number.');
    } else {
      clean.year = y;
    }
  } else {
    clean.year = null;
  }

  clean.genre = String(body.genre || '').trim();

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      errors.push('Status must be want, reading, or finished.');
    } else {
      clean.status = body.status;
    }
  } else {
    clean.status = 'want';
  }

  if (body.rating !== undefined && body.rating !== null && body.rating !== '') {
    const r = Number(body.rating);
    if (!Number.isInteger(r) || r < 0 || r > 5) {
      errors.push('Rating must be a whole number from 0 to 5.');
    } else {
      clean.rating = r;
    }
  } else {
    clean.rating = 0;
  }

  clean.notes = String(body.notes || '').trim();

  return { errors, clean };
}

const api = {
  async list(params = {}) {
    const url = new URL('/api/books', window.location.origin);
    if (params.status) url.searchParams.append('status', params.status);
    if (params.q) url.searchParams.append('q', params.q);

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch books.');
    return await response.json();
  },

  async get(id) {
    const response = await fetch(`/api/books/${id}`);
    if (!response.ok) throw new Error('Book not found.');
    return await response.json();
  },

  async create(data) {
    const { errors, clean } = validateBook(data);
    if (errors.length) throw { errors };

    const response = await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clean)
    });

    const result = await response.json();
    if (!response.ok) throw { errors: result.errors || [result.message || 'Error creating book.'] };
    
    return { id: result.id, ...clean };
  },

  async update(id, data) {
    const { errors, clean } = validateBook(data);
    if (errors.length) throw { errors };

    const response = await fetch(`/api/books/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clean)
    });

    const result = await response.json();
    if (!response.ok) throw { errors: result.errors || [result.message || 'Error updating book.'] };

    return { id, ...clean };
  },

  async remove(id) {
    const response = await fetch(`/api/books/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Could not delete book.');
    return await response.json();
  }
};

function starString(rating) {
  const n = Number(rating) || 0;
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function statusLabel(status) {
  return { want: 'want to read', reading: 'reading', finished: 'finished' }[status] || status;
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}