import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
    },
    carId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: [true, "Car ID is required"],
    },
    carName: {
      type: String,
      required: true,
    },
    carImage: {
      type: String,
    },
    dailyRentPrice: {
      type: Number,
      required: true,
    },
    driverNeeded: {
      type: Boolean,
      default: false,
    },
    specialNote: {
      type: String,
      trim: true,
      default: "",
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    bookingDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ userId: 1 });
bookingSchema.index({ carId: 1 });
bookingSchema.index({ status: 1 });

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
