// use a fixed UTC timezone for the whole test run, otherwise the date
// calculations (bank holiday dates etc.) change depending on the machine.
process.env.TZ = 'UTC';
