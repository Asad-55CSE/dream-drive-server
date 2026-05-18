import mongoose from "mongoose";

const carSchema = new mongoose.Schema(
  {
    carName: {
      type: String,
      required: [true, "Car name is required"],
      trim: true,
    },
    dailyRentPrice: {
      type: Number,
      required: [true, "Daily rent price is required"],
      min: [0, "Price cannot be negative"],
    },
    carType: {
      type: String,
      required: [true, "Car type is required"],
      enum: ["Sedan", "SUV", "Truck", "Convertible", "Hatchback", "Coupe", "Van", "Luxury", "Electric"],
    },
    image: {
      type: String,
      required: [true, "Car image is required"],
    },
    seatCapacity: {
      type: Number,
      required: [true, "Seat capacity is required"],
      min: 1,
      max: 20,
    },
    pickupLocation: {
      type: String,
      required: [true, "Pickup location is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    availability: {
      type: Boolean,
      default: true,
    },
    bookingCount: {
      type: Number,
      default: 0,
    },
    ownerId: {
      type: String,
      required: [true, "Owner ID is required"],
    },
    ownerName: {
      type: String,
    },
    ownerEmail: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

carSchema.index({ carName: "text" });
carSchema.index({ ownerId: 1 });
carSchema.index({ availability: 1 });

const Car = mongoose.model("Car", carSchema);
export default Car;
