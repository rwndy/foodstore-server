const createPaginationMeta = (count, limit, skip) => {
    const currentPage = Math.floor(skip / limit) + 1;
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;
    
    return {
        pagination: {
            currentPage,
            totalPages,
            totalItems: count,
            itemsPerPage: parseInt(limit),
            hasNextPage,
            hasPrevPage,
            nextPage: hasNextPage ? currentPage + 1 : null,
            prevPage: hasPrevPage ? currentPage - 1 : null
        }
    };
};

module.exports = { createPaginationMeta }