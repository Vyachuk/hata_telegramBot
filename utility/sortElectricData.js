const sortElectricData = (data) => {
  data.sort((a, b) => new Date(b.updateAt) - new Date(a.updateAt));
  return data;
};

module.exports = sortElectricData;
