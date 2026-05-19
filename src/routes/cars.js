import express from "express";
import Car from "../models/Car.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/cars — public, with search/filter/sort/pagination
router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      type = "",
      sort = "",
      page = 1,
      limit = 9,
    } = req.query;

    const query = {};

    if (search) {
      query.carName = { $regex: search, $options: "i" };
    }

    if (type && type !== "All") {
      query.carType = type;
    }

    let sortOption = { createdAt: -1 };
    if (sort === "price_asc") sortOption = { dailyRentPrice: 1 };
    if (sort === "price_desc") sortOption = { dailyRentPrice: -1 };
    if (sort === "newest") sortOption = { createdAt: -1 };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [cars, total] = await Promise.all([
      Car.find(query).sort(sortOption).skip(skip).limit(limitNum),
      Car.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: cars,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error("Get cars error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/cars/available — home page, 6 available cars
router.get("/available", async (req, res) => {
  try {
    const cars = await Car.find({ availability: true })
      .sort({ bookingCount: -1 })
      .limit(6);
    res.json({ success: true, data: cars });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/cars/my-cars — auth required
router.get("/my-cars", requireAuth, async (req, res) => {
  try {
    const cars = await Car.find({ ownerId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: cars });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/cars/:id — public
router.get("/:id", async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ success: false, message: "Car not found" });
    }
    res.json({ success: true, data: car });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/cars — auth required
router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      carName,
      dailyRentPrice,
      carType,
      image,
      seatCapacity,
      pickupLocation,
      description,
      availability,
    } = req.body;

    if (!carName || !dailyRentPrice || !carType || !image || !seatCapacity || !pickupLocation || !description) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const car = await Car.create({
      carName,
      dailyRentPrice: Number(dailyRentPrice),
      carType,
      image,
      seatCapacity: Number(seatCapacity),
      pickupLocation,
      description,
      availability: availability !== undefined ? availability : true,
      ownerId: req.user.id,
      ownerName: req.user.name,
      ownerEmail: req.user.email,
    });

    res.status(201).json({ success: true, data: car, message: "Car added successfully" });
  } catch (error) {
    console.error("Add car error:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// PUT /api/cars/:id — auth + owner required
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ success: false, message: "Car not found" });
    }

    if (car.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized to update this car" });
    }

    const allowedUpdates = ["carName", "dailyRentPrice", "carType", "image", "seatCapacity", "pickupLocation", "description", "availability"];
    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const updatedCar = await Car.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: updatedCar, message: "Car updated successfully" });
  } catch (error) {
    console.error("Update car error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// DELETE /api/cars/:id — auth + owner required
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ success: false, message: "Car not found" });
    }

    if (car.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this car" });
    }

    await Car.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Car deleted successfully" });
  } catch (error) {
    console.error("Delete car error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
