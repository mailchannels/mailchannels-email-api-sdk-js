export const mapBucket = (bucket: { count: number, period_start: string }) => {
  return {
    count: bucket.count,
    periodStart: bucket.period_start
  };
};
