const express = require("express");
const router = express.Router();
const User = require("../models/users");
const multer = require("multer");
const fs = require("fs");

// image upload
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  },
});

var upload = multer({
  storage: storage,
}).single("image");

// Insert an user into database route
router.post("/add", upload, async (req, res) => {
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    image: req.file.filename,
  });

  try {
    await user.save();
    req.session.message = {
      type: "success",
      message: "User added successfully!",
    };
    res.redirect("/");
  } catch (err) {
    res.json({ message: err.message, type: "danger" });
  }
});

// get all users route
router.get("/", (req, res) => {
  User.find()
    .exec()
    .then((users) => {
      res.render("index", {
        title: "Home Page",
        users: users,
      });
    })
    .catch((err) => {
      res.json({ message: err.message });
    });
});

router.get("/add", (req, res) => {
  res.render("add_users", { title: "Add Users" });
});

// Edit an user route
router.get("/edit/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);
    if (!user) {
      res.redirect("/");
      return;
    }
    res.render("edit_users", {
      title: "Edit Users",
      user: user,
    });
  } catch (err) {
    console.error(err);
    res.redirect("/");
  }
});

// Update user route
router.post("/update/:id", upload, async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let new_image = user.image;

    if (req.file) {
      new_image = req.file.filename;
      if (user.image !== "default.png") {
        fs.unlinkSync(`./uploads/${user.image}`);
      }
    }

    user.name = req.body.name;
    user.email = req.body.email;
    user.phone = req.body.phone;
    user.image = new_image;

    const updatedUser = await user.save();

    req.session.message = {
      type: "success",
      message: "User updated successfully",
    };
    res.redirect("/");
  } catch (err) {
    console.error(err);
    req.session.message = {
      type: "danger",
      message: err.message,
    };
    res.redirect("/");
  }
});

// Delete user route

router.get("/delete/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const result = await User.findByIdAndRemove(id);
    if (result !== null && result.image != "") {
      try {
        fs.unlinkSync("./uploads/" + result.image);
      } catch (err) {
        console.log(err);
      }
    }
    req.session.message = {
      type: "info",
      message: "User deleted successfully",
    };
    res.redirect("/");
  } catch (err) {
    res.json({ message: err.message });
  }
});
module.exports = router;
