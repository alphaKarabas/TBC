const User = require("../models/User");

module.exports = async (req, res, next) => {

  if (req.method === "OPTIONS") {
    next();
  }

  let userId = req.user.id;

  let user = await User.findOne({ _id: userId });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const TerminationDate = user.accountType?.TerminationDate;

  if (TerminationDate && new Date() > new Date(TerminationDate)) {
    user.accountType = {
      name: "BACE",
      createdDate: user.accountType?.createdDate,
    };
    try {
      user.save();
    } catch (error) {
      throw new Error(`try to upgrade user account type (${user.id}) from (${user.accountType?.name}}) to (BACE) failed`)
    }
  }
  
  switch (user.accountType?.name) {
    case "BANNED":
      if (TerminationDate) {
        return res.status(406).json({
          message: `You'r BANNED until ${new Date(TerminationDate)}`,
        });
      } else {
        return res.status(406).json({
          message: "You'r BANNED without urgent",
        });
      }
  }
  next();
};
