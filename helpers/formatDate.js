const formatDate = () => {
  const fullDate = new Date().toISOString().slice(0, 10);
  const [year, month, day] = fullDate.split("-");
  return { fullDate, year, month, day };
};

module.exports = formatDate;
