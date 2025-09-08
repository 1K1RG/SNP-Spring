export default function Title({mainText, subtext}) {
    return (
      <div className="ml-5">
        <h1 className="text-white text-2xl font-['Montserrat-Bold'] font-bold">
          {mainText}
        </h1>
        <h3 className="text-white text-sm font-['Open-Sans'] mt-[-1px]">
          {subtext}
        </h3>
      </div>
    );
  }
  