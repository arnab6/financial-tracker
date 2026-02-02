import mongoose, { Schema, Document, Model } from "mongoose";

export interface IExpense extends Document {
    date: Date;
    rawText: string;
    amount?: number;
    category?: string;
    paymentMethod?: string;
    description?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const ExpenseSchema: Schema = new Schema(
    {
        date: { type: Date, required: true, default: Date.now },
        rawText: { type: String, required: true },
        amount: { type: Number },
        category: { type: String },
        paymentMethod: { type: String },
        description: { type: String },
        metadata: { type: Schema.Types.Mixed },
    },
    {
        timestamps: true,
    }
);

const Expense: Model<IExpense> =
    mongoose.models.Expense || mongoose.model<IExpense>("Expense", ExpenseSchema);

export default Expense;
