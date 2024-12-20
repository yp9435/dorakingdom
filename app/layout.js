import '@styles/globals.css';

export const metadata = {
    title: "DoraKingdom",
    decription: "Turn studying into an epic adventure — together! At DoraKingdom."
}
const RootLayout = ( {children} ) => {
  return (
    <html lang='en'>
        <body>
            <div className='main'>
                <div className='bg'/>
            </div>
            <main className='app'>
                {children}
            </main>
        </body>
    </html>
  )
}

export default RootLayout;