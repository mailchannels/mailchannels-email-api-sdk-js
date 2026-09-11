export const parsePagination = (limit?: string, offset?: string) => {
  return {
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined
  };
};
