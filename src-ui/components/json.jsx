export function JsonView({ value }) {
    let formatted = JSON.stringify(value, null, '\t')
        .split('\n');

    return <div>
        {formatted.map(line => {
            let spaces = line.split('\t');
            return <p className="py-1">
                {spaces.slice(0, spaces.length - 1).map(a => <span className="w-4 inline-block">&nbsp;</span>)}{line}
            </p>
        })}
    </div>
}