import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    dprEmail: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    pocs: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        email: {
          type: String,
          trim: true,
        },
        phone: {
          type: String,
          trim: true,
        },
        status: {
          type: String,
          enum: ["done", "ongoing", "yet to contact", "rejected"],
          default: "yet to contact",
        },
        remarks: {
          type: String,
          trim: true,
        },
      },
    ],
    profiles: {
      type: [String],
    },
  },
  {
    timestamps: true,
  }
);

const Company = mongoose.model("Company", companySchema);

export default Company;
