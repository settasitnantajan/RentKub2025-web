import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

const TextAreaInput = ({ register, name, type, placeholder, errors }) => {
  return (
    <div className="mb-2">
      <Label htmlFor={name} className="capitalize">
        {name}
      </Label>
      <Textarea
        {...register(name)}
        type={type}
        rows={5}
        placeholder={placeholder}
        className={`${errors[name] && "border-red-500"}`}
      />
      {errors[name] && (
        <p className="text-red-500 text-xs mt-1">{errors[name].message}</p>
      )}
    </div>
  );
};
export default TextAreaInput;
