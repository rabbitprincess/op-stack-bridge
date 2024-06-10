import React, { useEffect, useState } from 'react';
import "../../assets/style/deposit.scss";
import "../../assets/style/withdraw.scss";
import toIcn from "../../assets/images/logo.png"
import metamask from "../../assets/images/metamask.svg"
import { GetL1Chain, GetL2Chain } from '../../config/chain';
import { createPublicClient, createWalletClient, custom, http, parseEther } from 'viem'
import { publicActionsL1, publicActionsL2, walletActionsL1, walletActionsL2 } from 'viem/op-stack'
import { Form, Image, Spinner } from "react-bootstrap";
import { Dai, Usdt, Usdc, Ethereum, Btc } from 'react-web3-icons';
import { MdOutlineSecurity } from "react-icons/md"
import { FaEthereum } from "react-icons/fa"
import { useAccount, useConnect, useNetwork, useSwitchNetwork, useBalance } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected';
import { IoMdWallet } from "react-icons/io"
import { HiSwitchHorizontal } from "react-icons/hi";
import TabMenu from '../TabMenu';

const Withdraw = () => {
  const [ethValue, setEthValue] = useState("")
  const [sendToken, setSendToken] = useState("ETH")
  const [errorInput, setErrorInput] = useState("")
  const [checkMetaMask, setCheckMetaMask] = useState("");
  const [loader, setLoader] = useState(false)
  const { address, isConnected } = useAccount()
  const { chain, chains } = useNetwork()
  const [Balance, setBalance] = useState(0)

  const L1Chain = GetL1Chain();
  const L2Chain = GetL2Chain();

  const { connect } = useConnect({
      connector: new InjectedConnector({ chains }),
      onError(error) {
          console.log('Error', error)
      },
      onMutate(args) {
          console.log('Mutate', args)
          if (args.connector.ready === true) {
              setCheckMetaMask(false)
          } else {
              setCheckMetaMask(true)
          }
      },
      onSettled(data, error) {
          console.log('Settled', { data, error })
      },
      onSuccess(data) {
          console.log('Success', data)
      },
  })
  const [metaMastError, setMetaMaskError] = useState("")
  const { error, isLoading, pendingChainId, switchNetwork } = useSwitchNetwork({
      // throwForSwitchChainNotSupported: true,
      chainId: process.env.REACT_APP_L2_CHAIN_ID,
      onError(error) {
          console.log('Error', error)
      },
      onMutate(args) {
          console.log('Mutate', args)
      },
      onSettled(data, error) {
          console.log('Settled', { data, error })
          try {
              window.ethereum.request({
                  method: "wallet_addEthereumChain",
                  params: [{
                      chainId: (function (dec) { return `0x${parseInt(dec, 10).toString(16)}`; })(L2Chain.id),
                      rpcUrls: L2Chain.rpcUrls.default.http,
                      chainName: L2Chain.name,
                      nativeCurrency: L2Chain.nativeCurrency,
                      blockExplorerUrls: [L2Chain.blockExplorers.default.url],
                  }]
              }).then((data) => {
                  setMetaMaskError("")
              }).catch((err) => {
                  if (err.code === -32002) {
                      setMetaMaskError("Request stuck in pending state")
                  }
              });
              console.log('Settled', { data, error })
          }
          catch (error) {
              console.log(error);
          }
      },
      onSuccess(data) {
          console.log('Success', data)
      },
  })
  //========================================================== BALANCES =======================================================================

  const { data } = useBalance({ address: address, chainId: L2Chain.id, watch: true })
  const dataUSDT = useBalance({ address: address, chainId: L2Chain.id, token: process.env.REACT_APP_L2_USDT, watch: true });
  const dataDAI = useBalance({ address: address, chainId: L2Chain.id, token: process.env.REACT_APP_L2_DAI, watch: true });
  const dataUSDC = useBalance({ address: address, chainId: L2Chain.id, token: process.env.REACT_APP_L2_USDC, watch: true });
  const datawBTC = useBalance({ address: address, chainId: L2Chain.id, token: process.env.REACT_APP_L2_wBTC, watch: true });

  useEffect(() => {
      console.log("dataUSDT", data)
  }, [])

  ////========================================================== WITHDRAW =======================================================================

  const handleWithdraw = async () => {
    if (!ethValue) {
        setErrorInput("Please enter the amount.")
        return;
    } else if (parseFloat(ethValue) <= 0) {
        setErrorInput("Please enter a valid amount: " + ethValue)
        return;
    }

    // Retrieve Account from an EIP-1193 Provider. 
    const [account] = await window.ethereum.request({ 
      method: 'eth_requestAccounts'
    })

    
    
    const publicClientL1 = createPublicClient({
      chain: L1Chain,
      transport: http()
    }).extend(publicActionsL1())
    
    const walletClientL1 = createWalletClient({
      account,
      chain: L1Chain,
      transport: custom(window.ethereum)
    }).extend(walletActionsL1())
    
    const publicClientL2 = createPublicClient({
      chain: L2Chain,
      transport: http()
    }).extend(publicActionsL2())
    
    const walletClientL2 = createWalletClient({
      account,
      chain: L2Chain,
      transport: custom(window.ethereum)
    }).extend(walletActionsL2())

    try {
      setErrorInput("");
      //-------------------------------------------------------- SEND TOKEN VALUE -----------------------------------------------------------------//
      switch (sendToken) {
        case 'ETH': {
          // Build parameters to initiate the withdrawal transaction on the L1.
          const args = await publicClientL1.buildInitiateWithdrawal({
            to: account,
            value: parseEther(ethValue)
          })

          setLoader(true);
          const hash = await walletClientL2.initiateWithdrawal(args);
          const receipt = await publicClientL2.waitForTransactionReceipt({ hash });
          const { output, withdrawal } = await publicClientL1.waitToProve({
            receipt,
            targetChain: walletClientL2.chain
          })

          while (true) {
            // Wait until the withdrawal is ready to prove.
            const status = await publicClientL1.getWithdrawalStatus({
              receipt,
              targetChain: walletClientL2.chain
            });
            if (status === 'ready-to-prove') {
              console.log("status is ready to prove", output, withdrawal);
              break;
            }
            console.log("status is not ready to prove", status);
            await new Promise((resolve) => setTimeout(resolve, 5000));
          }
          // Build parameters to prove the withdrawal on the L2.
          const proveArgs = await publicClientL2.buildProveWithdrawal({
            output,
            withdrawal
          })

          // Prove the withdrawal on the L1.
          const proveHash = await walletClientL1.proveWithdrawal(proveArgs)

          // Wait until the prove withdrawal is processed.
          const proveReceipt = await publicClientL1.waitForTransactionReceipt({
            hash: proveHash
          })
          console.log('prove Receipt', proveReceipt)

          // Wait until the withdrawal is ready to finalize.
          await publicClientL1.waitToFinalize({
            targetChain: walletClientL2.chain,
            withdrawalHash: withdrawal.withdrawalHash
          })

          // Finalize the withdrawal.
          const finalizeHash = await walletClientL1.finalizeWithdrawal({
            targetChain: walletClientL2.chain,
            withdrawal
          })

          // Wait until the withdrawal is finalized.
          const finalizeReceipt = await publicClientL1.waitForTransactionReceipt({
            hash: finalizeHash
          })

          console.log('finalize Receipt', finalizeReceipt);
          setLoader(false);
          break;
        }
        default:
          // TODO
      }
      //-------------------------------------------------------- SEND TOKEN VALUE END-----------------------------------------------------------------
      updateWallet();
    } catch (error) {
      setLoader(false);
      console.log({ error }, 98);
    }
  }

  const handleSwitch = () => {
    try {

      switchNetwork(L2Chain.id)
    }
    catch (error) {
      console.log(error);
    }
  }
  ////========================================================== HANDLE CHANGE =======================================================================
  const [checkDisabled, setCheckDisabled] = useState(false)

  const handleChange = (e) => {
    if (sendToken == "ETH") {
      if (Number(data?.formatted) < Number(e.target.value)) {
        setCheckDisabled(true)
        setErrorInput("Insufficient ETH balance.")
      } else {
        setCheckDisabled(false)
        setErrorInput("")
      }
      setEthValue(e.target.value)
    }
    if (sendToken == "DAI") {
      if (Number(dataDAI.data?.formatted) < e.target.value) {
        setCheckDisabled(true)
        setErrorInput("Insufficient DAI balance.")
      } else {
        setCheckDisabled(false)
        setErrorInput("")
      }
      setEthValue(e.target.value)
    }
    if (sendToken == "USDT") {
      if (Number(dataUSDT.data?.formatted) < e.target.value) {
        setCheckDisabled(true)
        setErrorInput("Insufficient DAI balance.")
      } else {
        setCheckDisabled(false)
        setErrorInput("")
      }
      setEthValue(e.target.value)
    }
    if (sendToken == "wBTC") {
      if (Number(datawBTC.data?.formatted) < e.target.value) {
        setCheckDisabled(true)
        setErrorInput("Insufficient wBTC balance.")
      } else {
        setCheckDisabled(false)
        setErrorInput("")
      }
      setEthValue(e.target.value)
    }
    if (sendToken == "USDC") {
      if (Number(dataUSDC.data?.formatted) < e.target.value) {
        setCheckDisabled(true)
        setErrorInput("Insufficient USDC balance.")
      } else {
        setCheckDisabled(false)
        setErrorInput("")
      }
      setEthValue(e.target.value)
    }
  }

  // ============= For Format balance =========================
  const formatBalance = (rawBalance) => {
    const balance = (parseInt(rawBalance) / 1000000000000000000).toFixed(6)
    return balance
  }
  // ============= Get and update balance =========================
  const updateWallet = async () => {
    const balance = formatBalance(await window.ethereum.request({
      method: "eth_getBalance",
      params: [address, "latest"]
    }))
    setBalance(balance)
  }

  useEffect(() => {
    updateWallet()
   
  }, [data])
  return (
    <>
      <div className='bridge_wrap'>
        <TabMenu />
        <section className='deposit_wrap'>
          <div className='withdraw_title_wrap'>
            <div className='withdraw_title_icn'>
              <MdOutlineSecurity />
            </div>
            <div className='withdraw_title_content'>
              <h3>Use the official bridge</h3>
              <p>This usually takes 7 days</p>
              <p>Bridge any token to Ethereum Mainnet</p>
            </div>
          </div>
          <div className='deposit_price_wrap'>
            <div className='deposit_price_title'>
              <p>From</p>
              <h5><Image src={toIcn} alt="To icn" fluid /> {L2Chain.name}</h5>
            </div>
            <div className='deposit_input_wrap'>
              <Form>
                <div className='deposit_inner_input'>
                  <Form.Control type='number' name="eth_value" value={ethValue} onChange={handleChange} placeholder="0" min="0" step="any" />
                  <Form.Select aria-label="Default select example" className='select_wrap' onChange={({ target }) => setSendToken(target.value)}>
                    <option>ETH</option>
                    <option value="DAI">DAI</option>
                    <option value="USDT">USDT</option>
                    <option value="wBTC">wBTC</option>
                    <option value="USDC">USDC</option>
                  </Form.Select>
                </div>
                <div className='input_icn_wrap'>
                  {sendToken == "ETH" ? <span className='input_icn'><Ethereum style={{ fontSize: '1.5rem' }} /></span> : sendToken == "DAI" ? <span className='input_icn'><Dai style={{ fontSize: '1.5rem' }} /></span> : sendToken == "USDT" ? <span className='input_icn'><Usdt style={{ fontSize: '1.5rem' }} /></span> : sendToken == "wBTC" ? <span className='input_icn'><Btc style={{ fontSize: '1.5rem' }} /></span> : <span className='input_icn'><Usdc style={{ fontSize: '1.5rem' }} /></span>}
                </div>
              </Form>
            </div>
            {errorInput && <small className='text-danger'>{errorInput}</small>}
            {sendToken === "ETH" ? address && <p className='wallet_bal mt-2'>Balance: {Number(data?.formatted).toFixed(5)} ETH</p> : sendToken === "DAI" ? address && <p className='wallet_bal mt-2'>Balance: {Number(dataDAI.data?.formatted).toFixed(5)} DAI</p> : sendToken == "USDT" ? address && <p className='wallet_bal mt-2'>Balance: {Number(dataUSDT.data?.formatted).toFixed(5)} USDT</p> : sendToken === "wBTC" ? address && <p className='wallet_bal mt-2'>Balance: {Number(datawBTC.data?.formatted).toFixed(5)} wBTC</p> : <p className='wallet_bal mt-2'>Balance: {Number(dataUSDC.data?.formatted).toFixed(5)} USDC</p>}
          </div>
          <div className='deposit_details_wrap'>
            <div className="deposit_details">
              <p>To:</p>
              <h5><FaEthereum /> {L1Chain.name}</h5>
            </div>
            <div className='withdraw_bal_sum'>
              {sendToken == "ETH" ? <span className='input_icn'><Ethereum style={{ fontSize: '1.5rem' }} /></span> : sendToken == "DAI" ? <span className='input_icn'><Dai style={{ fontSize: '1.5rem' }} /></span> : sendToken == "USDT" ? <span className='input_icn'><Usdt style={{ fontSize: '1.5rem' }} /></span> : sendToken == "wBTC" ? <span className='input_icn'><Btc style={{ fontSize: '1.5rem' }} /></span> : <span className='input_icn'><Usdc style={{ fontSize: '1.5rem' }} /></span>}
              <p>You’ll receive: {ethValue ? ethValue : "0"} {sendToken}</p>
              <div></div>
              {/* <span className='input_title'>ETH</span> */}
            </div>
          </div>
          <div className="deposit_btn_wrap">
            {checkMetaMask === true ? <a className='btn deposit_btn' href='https://metamask.io/' target='_blank'><Image src={metamask} alt="metamask icn" fluid /> Please Install Metamask Wallet</a> : !isConnected ? <button className='btn deposit_btn' onClick={() => connect()}><IoMdWallet />Connect Wallet</button> : chain.id !== L2Chain.id ? <button className='btn deposit_btn' onClick={handleSwitch}><HiSwitchHorizontal />Switch to {L2Chain.name} Testnet</button> :
              checkDisabled ? <button className='btn deposit_btn' disabled={true}>Withdraw</button> :
                <button className='btn deposit_btn' onClick={handleWithdraw} disabled={loader ? true : false}>{loader ? <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner> : "Withdraw"}</button>}
          </div>
          {metaMastError && <small className="d-block text-danger text-center mt-2">{metaMastError}</small>}
        </section>
      </div>
    </>
  )
}

export default Withdraw