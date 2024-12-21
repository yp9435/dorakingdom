import Nav from '@/components/Nav';
import Footer from '@components/Footer';
import '@styles/globals.css';
import initMyFirebase from '@firebase/firebaseinit';
export const metadata = {
    title: "DoraKingdom",
    decription: "Turn studying into an epic adventure — together! At DoraKingdom."
}
const RootLayout = ( {children} ) => {
  initMyFirebase();
  return (
    <html lang='en'>
        <body>
            <Nav />
            <div className='flex flex-col min-h-screen'>
                <Nav />
                <div className='main'>
                    <div className='bg'/>
                </div>
                <main className='app flex-grow'>
                    {children}
                </main>
                <Footer />
            </div>
        </body>
    </html>
  )
}

export default RootLayout;