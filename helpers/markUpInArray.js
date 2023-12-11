const markUpInArray = (markup) => {
  const resultArray = [];

  for (let i = 0; i < markup.length; i += 2) {
    if (i + 1 < markup.length) {
      const pair = [markup[i], markup[i + 1]];
      resultArray.push(pair);
    } else {
      resultArray.push([markup[i]]);
    }
  }
  return resultArray;
};

module.exports = markUpInArray;
