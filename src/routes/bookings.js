import express from "express";
import Booking from "../models/Booking.js";
import Car from "../models/Car.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/bookings/my-bookings — auth required
router.get("/my-bookings", requireAuth, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error("Get bookings error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/bookings — auth required
router.post("/", requireAuth, async (req, res) => {
  try {
    const { carId, driverNeeded, specialNote, bookingDate } = req.body;

    if (!carId || !bookingDate) {
      return res.status(400).json({
        success: false,
        message: "Car ID and booking date are required",
      });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ success: false, message: "Car not found" });
    }

    if (!car.availability) {
      return res.status(400).json({ success: false, message: "Car is not available for booking" });
    }

    const totalPrice = driverNeeded
      ? car.dailyRentPrice + 50
      : car.dailyRentPrice;

    const booking = await Booking.create({
      userId: req.user.id,
      carId: car._id,
      carName: car.carName,
      carImage: car.image,
      dailyRentPrice: car.dailyRentPrice,
      driverNeeded: driverNeeded || false,
      specialNote: specialNote || "",
      totalPrice,
      bookingDate: new Date(bookingDate),
      status: "pending",
    });

    // Increment bookingCount using $inc
    await Car.findByIdAndUpdate(carId, { $inc: { bookingCount: 1 } });

    res.status(201).json({
      success: true,
      data: booking,
      message: "Car booked successfully!",
    });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// DELETE /api/bookings/:id — cancel booking, auth + owner
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (booking.status === "completed") {
      return res.status(400).json({ success: false, message: "Cannot cancel a completed booking" });
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Booking cancelled successfully" });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
