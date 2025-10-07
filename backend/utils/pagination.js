/**
 * Pagination utility functions
 */

import config from '../config.js';

// Parse pagination parameters from request
export const parsePaginationParams = (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || config.pagination.defaultLimit;
  const skip = (page - 1) * limit;
  const sort = req.query.sort || config.pagination.defaultSort;
  const search = req.query.search || '';

  return {
    page,
    limit: Math.min(limit, config.pagination.maxLimit),
    skip,
    sort: parseSortParam(sort),
    search: search.trim()
  };
};

// Parse sort parameter
const parseSortParam = (sortParam) => {
  if (!sortParam) return {};
  
  const sortObj = {};
  const sortFields = sortParam.split(',');
  
  sortFields.forEach(field => {
    const trimmedField = field.trim();
    if (trimmedField.startsWith('-')) {
      sortObj[trimmedField.substring(1)] = -1;
    } else {
      sortObj[trimmedField] = 1;
    }
  });
  
  return sortObj;
};

// Build search query
export const buildSearchQuery = (searchTerm, searchFields) => {
  if (!searchTerm || !searchFields || searchFields.length === 0) {
    return {};
  }

  const searchRegex = new RegExp(searchTerm, 'i');
  const searchQueries = searchFields.map(field => ({
    [field]: { $regex: searchRegex }
  }));

  return { $or: searchQueries };
};

// Build filter query
export const buildFilterQuery = (req, allowedFilters = []) => {
  const filters = {};
  
  allowedFilters.forEach(filter => {
    if (req.query[filter]) {
      if (filter === 'status' || filter === 'role' || filter === 'type') {
        filters[filter] = req.query[filter];
      } else if (filter === 'subject' || filter === 'topic') {
        filters[filter] = new RegExp(req.query[filter], 'i');
      } else if (filter.includes('Date')) {
        // Handle date range filters
        const dateValue = new Date(req.query[filter]);
        if (!isNaN(dateValue)) {
          if (filter.includes('From') || filter.includes('After')) {
            filters[filter.replace('From', '').replace('After', '')] = { $gte: dateValue };
          } else if (filter.includes('To') || filter.includes('Before')) {
            filters[filter.replace('To', '').replace('Before', '')] = { $lte: dateValue };
          } else {
            filters[filter] = dateValue;
          }
        }
      } else {
        filters[filter] = req.query[filter];
      }
    }
  });

  return filters;
};

// Execute paginated query
export const executePaginatedQuery = async (Model, query = {}, options = {}) => {
  const {
    page = 1,
    limit = config.pagination.defaultLimit,
    sort = config.pagination.defaultSort,
    populate = null,
    select = null,
    lean = false
  } = options;

  const skip = (page - 1) * limit;

  // Count total documents
  const totalItems = await Model.countDocuments(query);
  const totalPages = Math.ceil(totalItems / limit);

  // Build the query
  let dbQuery = Model.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  // Apply select if provided
  if (select) {
    dbQuery = dbQuery.select(select);
  }

  // Apply populate if provided
  if (populate) {
    if (Array.isArray(populate)) {
      populate.forEach(pop => {
        dbQuery = dbQuery.populate(pop);
      });
    } else {
      dbQuery = dbQuery.populate(populate);
    }
  }

  // Apply lean if requested
  if (lean) {
    dbQuery = dbQuery.lean();
  }

  // Execute query
  const data = await dbQuery;

  return {
    data,
    pagination: {
      page,
      limit,
      totalPages,
      totalItems,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null
    }
  };
};

// Create pagination metadata
export const createPaginationMeta = (page, limit, totalItems) => {
  const totalPages = Math.ceil(totalItems / limit);
  
  return {
    currentPage: page,
    totalPages,
    totalItems,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    previousPage: page > 1 ? page - 1 : null,
    startIndex: ((page - 1) * limit) + 1,
    endIndex: Math.min(page * limit, totalItems)
  };
};

// Aggregate with pagination
export const aggregateWithPagination = async (Model, pipeline, options = {}) => {
  const {
    page = 1,
    limit = config.pagination.defaultLimit
  } = options;

  const skip = (page - 1) * limit;

  // Create count pipeline
  const countPipeline = [
    ...pipeline,
    { $count: 'totalItems' }
  ];

  // Create data pipeline
  const dataPipeline = [
    ...pipeline,
    { $skip: skip },
    { $limit: limit }
  ];

  // Execute both pipelines
  const [countResult, dataResult] = await Promise.all([
    Model.aggregate(countPipeline),
    Model.aggregate(dataPipeline)
  ]);

  const totalItems = countResult[0]?.totalItems || 0;
  const totalPages = Math.ceil(totalItems / limit);

  return {
    data: dataResult,
    pagination: {
      page,
      limit,
      totalPages,
      totalItems,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null
    }
  };
};

// Get paginated results with search and filters
export const getPaginatedResults = async (Model, req, options = {}) => {
  const {
    searchFields = [],
    allowedFilters = [],
    populate = null,
    select = null,
    defaultSort = { createdAt: -1 },
    lean = false
  } = options;

  // Parse pagination parameters
  const { page, limit, sort, search } = parsePaginationParams(req);

  // Build base query
  let query = {};

  // Add search query
  if (search && searchFields.length > 0) {
    const searchQuery = buildSearchQuery(search, searchFields);
    query = { ...query, ...searchQuery };
  }

  // Add filter query
  const filterQuery = buildFilterQuery(req, allowedFilters);
  query = { ...query, ...filterQuery };

  // Execute paginated query
  const result = await executePaginatedQuery(Model, query, {
    page,
    limit,
    sort: Object.keys(sort).length > 0 ? sort : defaultSort,
    populate,
    select,
    lean
  });

  return result;
};

// Validate pagination parameters
export const validatePaginationParams = (page, limit) => {
  const errors = [];

  if (page && (!Number.isInteger(page) || page < 1)) {
    errors.push('Page must be a positive integer');
  }

  if (limit && (!Number.isInteger(limit) || limit < 1 || limit > config.pagination.maxLimit)) {
    errors.push(`Limit must be between 1 and ${config.pagination.maxLimit}`);
  }

  return errors;
};

// Create pagination links (useful for API responses)
export const createPaginationLinks = (baseUrl, page, totalPages, limit) => {
  const links = {
    self: `${baseUrl}?page=${page}&limit=${limit}`,
    first: `${baseUrl}?page=1&limit=${limit}`,
    last: `${baseUrl}?page=${totalPages}&limit=${limit}`
  };

  if (page > 1) {
    links.prev = `${baseUrl}?page=${page - 1}&limit=${limit}`;
  }

  if (page < totalPages) {
    links.next = `${baseUrl}?page=${page + 1}&limit=${limit}`;
  }

  return links;
};

export default {
  parsePaginationParams,
  buildSearchQuery,
  buildFilterQuery,
  executePaginatedQuery,
  createPaginationMeta,
  aggregateWithPagination,
  getPaginatedResults,
  validatePaginationParams,
  createPaginationLinks
};